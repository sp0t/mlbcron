
exports.genToken = () => {
	var str = "PWF380001B" + ':' + "B6jr^hVwq$@R";
	var token =  'Basic ' + Buffer.from(str, 'utf-8').toString('base64');
    return token;
}