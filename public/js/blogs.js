var search = document.querySelector('.search')
if(search){
    search.onfocus = function () {
        if (search.value == '请输入关键字词') {
            search.value = ''
        }
    }
    search.onblur = function () {
        if (search.value == '') {
            search.value = '请输入关键字词'
        }
    }
}


// var navRight=document.querySelector('.nav-right')
// var navLis=document.querySelectorAll('.nav-right>li')
// for(var i=0;i<navLis.length;i++){
//     navLis[i].index=i
//     navLis[i].onclick=function(){
//         this.style.color='red'
//     }
// }

// 删除

var del = document.querySelector('.del')
if (del) {
    del.onclick = function (ev) {
        if (!confirm('确定要删除吗')) {
            ev.preventDefault()

        }
    }
}
