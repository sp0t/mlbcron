
exports.genToken = () => {
	var str = "PWF380001B" + ':' + "B6jr^hVwq$@R";
	var token =  'Basic ' + Buffer.from(str, 'utf-8').toString('base64');
    return token;
}

exports.generateUUID = () => {
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}