var express = require('express');
var app = express();
app.use(express.static('public'));
var fs = require('fs')
var User = require('./modules/db/user')
var Publish = require('./modules/db/publish')
var Reply = require('./modules/db/reply')
var tools = require('./modules/tools');
var favicon=require('serve-favicon')
var path=require('path')


app.engine('html', require('express-art-template'));
app.use(express.urlencoded({ extended: flash }));

var flash = require('connect-flash')
app.use(flash())
// 小图标
app.use(favicon(path.join(__dirname,'public/img/favicon.jpg')))
var md5 = require('md5')

var session = require('express-session')
var MongoStore = require('connect-mongo')(session)

var multer = require('multer')
var uploadpath = './public/img/';
var headername;

var stroage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadpath)

    },
    filename: function (req, file, cb) {
        var arr = file.originalname.split('.')
        var ext = arr[arr.length - 1]
        headername = req.session.user.username + '-' + Date.now() + '.' + ext
        // console.log(headername);

        cb(null, headername)
    }
})
var upload = multer({
    storage: stroage,
    limits: {
        fieldSize: 1024 * 1024 * 10
    }
})


app.use(session({
    secret: 'mylogin',
    resave: true,
    saveUninitialized: true,
    rolling: true,
    cookie: {
        maxAge: 1000 * 60 * 60
    },
    store: new MongoStore({
        url: 'mongodb://127.0.0.1/blogs'
    })

}))


// 首页
app.get('/', (req, res) => {
    var page = (req.query.page || 1) * 1
    var show = 5
    Publish
        .find()
        .sort({ time: -1 })
        .skip((page - 1) * show)
        .limit(show)
        .populate('author')
        .exec((err, data) => {
            var pubs = JSON.parse(JSON.stringify(data))
            Publish.countDocuments((err, count) => {
                var allPages = Math.ceil(count / show)
                res.render('index.html', {
                    user: req.session.user,
                    pubs,
                    page,
                    allPages,
                    show,

                })
            })


        })

})


// 注册页面
app.get('/regist', (req, res) => {
    var error = req.flash('error').toString()
    var error1 = req.flash('error1').toString()
    res.render('regist.html', { error, error1 })
})

app.post('/regist', (req, res) => {
    User.findOne({ username: req.body.username }, (err, data) => {
        if (data) {
            req.flash('error', '用户名已被注册')
            res.redirect('/regist')
        }
        else {
            if (req.body.repassword !== req.body.password) {

                req.flash('error1', '两次密码不一致，请重输')
                res.redirect('/regist')
            } else {

                req.body.password = md5(req.body.password)
                var userObj = Object.assign(req.body, {
                    headerurl: '/img/timg.jpg'
                })
                var user = new User(userObj)
                // var user = new User(req.body)
                user.save(err => {
                    res.redirect('/login')
                })
            }
        }
    })
})

// 登录
app.get('/login', (req, res) => {
    var error = req.flash('error').toString()
    var error1 = req.flash('error1').toString()
    res.render('login.html', { error, error1 })
})
app.post('/login', (req, res) => {
    User.findOne({ username: req.body.username }, (err, data) => {
        if (!data) {
            req.flash('error', '用户不存在，请先注册')
            res.redirect('/login')
        }
        else {

            if (md5(req.body.password) == data.password) {
                req.session.user = data
                res.redirect('/')

            }
            else {
                req.flash('error1', '密码不正确')
                res.redirect('/login')
            }

        }
    })
})

app.get('/edit/userinfo', (req, res) => {
    res.render('userinfo.html', {
        user: req.session.user,

    })
})
app.post('/edit/userinfo', (req, res) => {
    res.send('修改成功')
})

app.get('/edit/header/:name', (req, res) => {
    res.render('headerimg.html', { user: req.session.user })
})

// 编辑头像
app.post('/upload/header', upload.single('headerimg'), (req, res) => {

    var headerurl = '/img/' + headername
    if (fs.existsSync(uploadpath + headername)) {
        User.findOne({ _id: req.session.user._id }, (err, user) => {
            if (user.headerurl != '/img/timg.jpg') {
                console.log('123');
                
                fs.unlinkSync('./public' + user.headerurl)
            }
            user.headerurl = headerurl;
            user.save(() => {
                req.session.user.headerurl = headerurl;
                res.redirect('/')
            })
        })
    } else {

        res.send('上传失败')
    }
})

// 关于
app.get('/about', (req, res) => {
    res.render('about.html', { user: req.session.user })
})



// 发布
app.get('/publish', (req, res) => {
    var error = req.flash('error').toString()
    res.render('publish.html', {
        user: req.session.user,
        error
    })
})
app.post('/publish', (req, res) => {
    if (req.session.user) {
        var pub = new Publish({
            title: req.body.title,
            pub: req.body.publish,
            time: tools.dateFormat(),
            reply: [],
            note: req.body.note,
            author: req.session.user._id,
            count: 0
        })
        pub.save((err) => {
            if (err) {
                console.log('保存失败');

            } else {
                res.redirect('/')
            }
        })

    }
    else {

        req.flash('error', '请先登录')
        res.redirect('/publish')
    }

})

// 发布的具体信息
app.get('/message/:_id', (req, res) => {

    Publish
        .find({ _id: req.params._id })
        .populate('author')
        .populate('reply')
        .exec((err, data) => {
            if (err) {
                console.log('查找失败');
            } else {

                Publish.updateOne({ _id: req.params._id }, { count: data[0].count + 1 }, (err, data) => {

                })
                var pubs = JSON.parse(JSON.stringify(data))
                res.render('message.html', {
                    user: req.session.user,
                    pubs,
                })

            }
        })

})

app.post('/reply', (req, res) => {
    var rep = new Reply({
        reply: req.body.reply,
        time: tools.dateFormat(),
        username: req.session.user.username
    })
    rep.save(err => {
        Publish.findOne({ _id: req.body._id }, (err, pubs) => {
            if (err) {
                console.log('存储失败');
            } else {
                pubs.reply.push(rep._id);
                pubs.save(err => {
                    console.log('保存成功了');
                    res.redirect('/message/' + req.body._id);
                })
            }
        })
    })
})

// 编辑
app.get('/editor', (req, res) => {
    Publish.findOne({ _id: req.query._id }, (err, data) => {
        var pubs = JSON.parse(JSON.stringify(data))
        if (err) {
            console.log('存储失败');
        } else {
            res.render('editor.html', {
                user: req.session.user,
                pubs
            })

        }
    })

})
app.post('/editor', (req, res) => {
    Publish.updateOne({ _id: req.body._id }, {
        note: req.body.note,
        title: req.body.title,
        pub: req.body.publish
    }, (err, pubs) => {
        res.redirect('/');

    })

})

// 删除
app.get('/delete', (req, res) => {
    Publish.findByIdAndDelete({ _id: req.query._id }, (err, data) => {
        if (err) {
            console.log('删除失败');

        } else {
            res.redirect('/');
        }
    })

})

// 作者点击跳转
app.get('/author/:user_id', (req, res) => {
    var page = (req.query.page || 1) * 1
    var show = 5
    Publish
        .find({
            author: req.params.user_id
        })
        .sort({ time: -1 })
        .skip((page - 1) * show)
        .limit(show)
        .populate('author')
        .exec((err, data) => {
            Publish.countDocuments({
                author: req.params.user_id
            }, (err, count) => {
                var allPages = Math.ceil(count / show)
                res.render('querys.html', {
                    user: req.session.user,
                    pubs: JSON.parse(JSON.stringify(data)),
                    page,
                    allPages,
                    show,
                    user_id: req.params.user_id
                })
            })
        })
})

// 标签
app.get('/note', (req, res) => {
    var notes = []
    Publish.find().exec((err, data) => {
        data.forEach((pub) => {
            pub.note.forEach(pub => {
                notes.push(pub)
            })
        })
        var note = tools.notesFormat(notes)
        res.render('note.html', {
            note,
            user: req.session.user

        })
    })
})

// 标签点击查询
app.get('/querys/:note', (req, res) => {
    var show = 5
    var page = (req.query.page || 1) * 1
    Publish
        .find({ note: req.params.note })
        .sort({ time: -1 })
        .skip((page - 1) * show)
        .limit(show)
        .populate('author')
        .exec((err, data) => {
            Publish.countDocuments({ note: req.params.note }, (err, count) => {
                var allPages = Math.ceil(count / show)
                res.render('notes.html', {
                    user: req.session.user,
                    pubs: JSON.parse(JSON.stringify(data)),
                    page,
                    allPages,
                    show,
                    note: req.params.note
                })
            })
        })


})


// 搜索
app.get('/search', (req, res) => {
    var idarr = [];
    User.find({
        username: {
            $regex: req.query.search, $options: '$i'
        }
    })
        .exec((err, data) => {
            data.forEach(el => {
                idarr.push(el._id)
            })
            var show = 5
            var page = (req.query.page || 1) * 1
            Publish
                .find({
                    $or: [
                        { title: { $regex: req.query.search, $options: '$i' } },
                        { note: { $regex: req.query.search, $options: '$i' } },
                        { author: { $in: idarr} },

                    ]
                })
                .sort({ time: -1 })
                .skip((page - 1) * show)
                .limit(show)
                .populate('author')
                .exec((err, data) => {
                    if (err) {
                        console.log(err);
                    } else {
                        Publish.countDocuments({
                            $or: [
                                { title: { $regex: req.query.search, $options: '$i' } },
                                { note: { $regex: req.query.search, $options: '$i' } },
                                { author: { $in: idarr} }

                            ]
                        }, (err, count) => {
                            var allPages = Math.ceil(count / show)
                            res.render('search.html', {
                                user: req.session.user,
                                pubs: JSON.parse(JSON.stringify(data)),
                                page,
                                allPages,
                                show,
                                search: req.query.search

                            })
                        })

                    }

                });

        })

})


// 存档
app.get('/archive', (req, res) => {
    var page = (req.query.page || 1) * 1
    var show = 5
    Publish
        .find()
        .sort({ time: -1 })
        .skip((page - 1) * show)
        .limit(show)
        .exec((err, all) => {
            Publish.countDocuments((err, count) => {
                var pubs = JSON.parse(JSON.stringify(all))
                res.render('archive.html',
                    {
                        user: req.session.user,
                        pubs,
                        lastYear: -1,
                        page,
                        allPages: Math.ceil(count / show),
                        show
                    }
                )

            })

        })
})



















// 登出
app.get('/logout', (req, res) => {

    req.session.user = null;
    res.redirect('/')
})


app.listen(3000, () => {
    console.log('node running');
});