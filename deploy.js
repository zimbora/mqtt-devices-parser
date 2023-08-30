const fs = require('fs').promises;

$ = {};
$.config = require('./config');
$.models = require('./models/models.js');
var projectsPath = './src/projects/';
var project = [];

async function readModelsInsideProjects(){

	return new Promise( async (resolve,reject) => {

		// load projects dbs
		var files = await fs.readdir(projectsPath)

	    files = files.filter((file) => {
	    	// Exclude any extension file
	    	return (file.indexOf('.') == -1);
	    })

	    let counter_help = 0;
	    files.forEach( async(name,counter) => {
	    	if($.config.projects[name]){
		    	project[name] = {
		        	module : null
				};
				project[name].module = require('./src/projects/'+name+'/'+name+".js")
				await project[name].module.sync_db();
				counter_help++;
				if(files.length == counter_help) return resolve();
	    	}else{
	    		counter_help++;
				if(files.length == counter_help) return resolve();
	    	}

	    });

	});

}


async function init(){

	await $.models.init();
	await $.models.connect();

	//main tables
	if($.config.sync_main_tables){
		await $.models.load(__dirname+"/models");
		await $.models.dropTableIndexes();
		await $.models.sync();

		let user = await $.models.insertUser("admin","admin",5); // ads user
		//console.log(user);
		let user_id = user.dataValues.id;
		await $.models.insertUser("device","device",3);
		await $.models.insertUser("client","client_pwd",3);
		await $.models.insertClient("admin","admin",user_id); // ads client with credentials admin@admin
	}

	// project tables
	await readModelsInsideProjects();
	await $.models.dropTableIndexes();
    await $.models.sync();

}


init();
