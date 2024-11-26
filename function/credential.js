
exports.genToken = () => {
	var str = "PWF3800029" + ':' + "ccDD77888";
	var token =  'Basic ' + Buffer.from(str, 'utf-8').toString('base64');
    return token;
}
