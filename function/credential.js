
exports.genToken = () => {
	var str = "PW7110000P" + ':' + "Password1!";
	var token =  'Basic ' + Buffer.from(str, 'utf-8').toString('base64');
    return token;
}
