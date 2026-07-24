
module.exports = {

	pathIntoObject : (path,data)=>{
		const segments = path.split("/").filter(segment => segment !== "");

		let obj = {};
		let currentObj = obj;

		segments.forEach((segment, index) => {
			if (index === segments.length - 1) {
				currentObj[segment] = data;
			} else {
				currentObj[segment] = {};
				currentObj = currentObj[segment];
			}
		});
		return obj;
	},

	getFirstWord : (str)=>{
		const slashIndex = str.indexOf('/');
		if (slashIndex === -1) {
			// No slash found, return the original string
			return str;
		}
		return str.substring(0,slashIndex);
	},

	getTopicAfterSlash : (str)=>{
		const slashIndex = str.indexOf('/');
		if (slashIndex === -1) {
		// No slash found, return empty string
		return "";
		}
		return str.substring(slashIndex + 1);
	},

	getWordAfterLastSlash : (str)=>{
		const lastSlashIndex = str.lastIndexOf('/');
		if (lastSlashIndex === -1) {
			// No slash found, return the original string
			return str;
		}
		return str.substring(lastSlashIndex + 1);
	},

	getWordBeforeLastSlash : (str)=>{
		const lastSlashIndex = str.lastIndexOf('/');
		if (lastSlashIndex === -1) {
			// No slash found, return the original string
			return str;
		}
		return str.substring(0,lastSlashIndex);
	}
}
