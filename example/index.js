config = require('./config');
const fs = require('fs');
const parser = require('mqtt-devices-parser');

global.BASE_DIR = process.cwd();
var projectsPath = '../projects/';
var projects = [];

fs.readdirSync(projectsPath)
.filter((file) => {
  return (file.indexOf('.') == -1);
})
.forEach((project) => {
  if(config.projects[project])
    projects.push(project);
});

parser.init(config,projects);

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // exit with failure code
  if($.config.dev)
    process.exit(1);
});
