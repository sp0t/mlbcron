
exports.genToken = () => {
	var str = "PWF3800029" + ':' + "ccDD7788";
	var token =  'Basic ' + Buffer.from(str, 'utf-8').toString('base64');
    return token;
}
