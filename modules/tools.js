// 时间格式化
function dateFormat(){
    var date=new Date()
    var year=date.getFullYear();
    var month=date.getMonth()+1;
    var day=date.getDate()
    var hour=date.getHours()
    var minutes=date.getMinutes()
    var seconds=date.getSeconds()
    month=month>10?month:'0'+month;
    day=day>10?day:'0'+day;
    hour=hour>10?hour:'0'+hour
    minutes=minutes>10?minutes:'0'+minutes
    seconds=seconds>10?seconds:'0'+seconds

    var time={
        year,
        month:`${year}-${month}`,
        day:`${year}-${month}-${day}`,
        hour:`${year}-${month}-${day} ${hour}`,
        minutes:`${year}-${month}-${day} ${hour}:${minutes}`,
        seconds:`${year}-${month}-${day} ${hour}:${minutes}:${seconds}`,
    }
    return   time

}
function notesFormat(arr){
    return Array.from(new Set(arr))
}

module.exports = {
    dateFormat,
    notesFormat
    
};