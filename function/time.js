exports.getTodayStartTime = () => {
    let today = new Date();
    today.setUTCHours(0, 0, 0, 0); 
    return today;
}

exports.getTodayAt2PM = () => {
    let today = new Date();
    today.setUTCHours(14, 0, 0, 0); 
    return today;
}

exports.getDiffernceDateWithMin = (date1, date2) => {
    var differenceInMilliseconds = date2 - date1;
    console.log(differenceInMilliseconds)
    if (date1 > date2)
        return -1;

    var differenceInSeconds = differenceInMilliseconds / 1000;
    var differenceInMinutes = differenceInSeconds / 60;
    return differenceInMinutes;
}

exports.getDiffernceDateWithHour = (date1, date2) => {
    var differenceInMilliseconds = date2 - date1;
    if (date1 > date2)
        return -1;

    var differenceInSeconds = differenceInMilliseconds / 1000;
    var differenceInMinutes = differenceInSeconds / 60;
    var differenceInHours = differenceInMinutes / 60;
    return differenceInHours;
}

exports.addOneDayToDate = (date) => {
    date.setDate(date.getDate() + 1)
  
    return date
  }

exports.dateToString = (date) => {
    var yy = date.getFullYear();
    var mm = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1) : (date.getMonth() + 1);
    console.log(date.getDate())
    var dd = date.getDate().length < 10 ? '0' + date.getDate() : date.getDate();
    var str = yy + '/' + mm + '/' + dd;
    return str;
}