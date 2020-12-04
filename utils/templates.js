const ejs = require('ejs');

module.exports = {
    // Función para renderizar los templates con los argumentos
    // Pasar dos parámetros por un lado el Content y por otro lado data los datos que serán los argumentos. Por ejemplo el nombre del proyecto.
    render: function (content, data) {
        return ejs.render(content, data);
    }
};