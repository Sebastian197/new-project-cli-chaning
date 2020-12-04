#!/usr/bin/env node

// Los imports
const fs = require('fs');
const path = require('path');
const inquirer = require('inquirer');
const shelljs = require('shelljs');
const chalk = require('chalk');

// utils
const render = require('./utils/templates').render;

// Obtener las opciones de los templates.
const TEMPLATE_OPTIONS = fs.readdirSync(path.join(__dirname, 'templates'));

const QUESTIONS = [
    {
        name: 'template',
        type: 'list',
        message: '¿Que tipo de proyecto quieres generar?',
        choices: TEMPLATE_OPTIONS
    },
    {
        name: 'project',
        types: 'input',
        message: '¿Cuál es el nombre del proyecto?',
        validate: function (input) {
            if (/^([a-z@]{1}[a-z\-\.\\\/0-9]{0,213})+$/.test(input)) return true;
            return 'El nombre del proyecto solo puede tener 214 carácteres y tiene que empezar en minúsculas o con una @';
        }
    }
];

const CURRENT_DIR = process.cwd(); //Me  dice el directorio actual.

inquirer.prompt(QUESTIONS)
    .then(resp => {
        const template = resp['template'];
        const project = resp['project'];

        const templatePath = path.join(__dirname, 'templates', template);
        const pathTarget = path.join(CURRENT_DIR, project);

        if (!createProject(pathTarget)) return;

        createDirectoriesFilesContent(templatePath, project);

        postProccess(templatePath, pathTarget);

    });

/**
 * Función para crear el proyecto.
 * @param {string} projectPath Nombre de la ruta  del proyecto.
 * @returns true sí se crea satisfactoriamente ó false sí no lo crea.
 */
const createProject = (projectPath) => {
    // Comprobar si no existe el directorio
    if (fs.existsSync(projectPath)) {
        console.log(
            chalk.red('No puedes crear el projecto porque ya existe, intenta con otro!')
        )
        return false;
    }
    fs.mkdirSync(projectPath);
    return true;
};

/**
 * Función para crear los directorios y los ficheros del template que hemos seleccionado.
 * @param {string} templatePath Ruta del template.
 * @param {object} projectName Proyecto.
 */
const createDirectoriesFilesContent = (templatePath, projectName) => {
    // Obtener la lista de directorios y de ficheros del template que hemos seleccionado.
    const listFiledirectories = fs.readdirSync(templatePath);

    listFiledirectories.forEach(item => {
        // Cojer el path del template
        const originPath = path.join(templatePath, item);

        // Obtener las propiedades del fichero ó directorio.
        const stats = fs.statSync(originPath);

        // Añadir el path de escritura, donde vamos a escribir.
        const writePath = path.join(CURRENT_DIR, projectName, item);

        // Comprobar si es un fichero o es un directorio.
        if (stats.isFile()) {
            // Leer la información de ese fichero para poder escribirla.
            let content = fs.readFileSync(originPath, 'utf-8');

            content = render(content, { projectName });

            // Hacer la escritura del contenido del fichero.
            fs.writeFileSync(writePath, content, 'utf-8');

            // Información adicional.
            const CREATE = chalk.green('CREATE ');
            const size = stats['size'];

            console.log(`${CREATE} ${originPath} (${size} bytes)`);

        } else if (stats.isDirectory()) {
            // Crear una carpeta.
            fs.mkdirSync(writePath);

            // Añadir una función recursiva. Para copiar todo el contenido que hay en ese directorio.
            createDirectoriesFilesContent(path.join(templatePath, item), path.join(projectName, item));
        }
    });
};

/**
 * Función que genera las dependencias automáticamente. Como lo hace por ejemplo angular.
 * @param {string} templatePath Ruta de template.
 * @param {string} targetPath Ruta del proyect.
 */
const postProccess = (templatePath, targetPath) => {
    // Verificar sí es un proyecto de node. Comprobar que tiene un fichero package.json.
    const isNode = fs.existsSync(path.join(templatePath, 'package.json'));

    if (isNode) {
        shelljs.cd(targetPath);
        console.log(
            chalk.green(`Instalando las dependencias en ${targetPath}`)
        );

        const result = shelljs.exec('npm install');

        if (result.code != 0) return false;
    }
};