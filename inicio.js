var http=require('http');
var url=require('url');
var fs=require('fs');
var querystring = require('querystring');
var mysql=require('mysql');

//cadena de conexion a la base de datos
var conexion=mysql.createConnection({
    host:'sql10.freemysqlhosting.net', 
    port: "3306",
    user:'sql10373599',
    password:'Rr48WumAvx',
    database:'sql10373599'
});
//conexion con la base de datos
conexion.connect(function (error){
    if (error)
        console.log('Problemas de conexion con mysql');
        console.log(error)
});
//establecer el servidor
var servidor=http.createServer(function(pedido,respuesta){
    var objetourl = url.parse(pedido.url);
    var camino='public'+objetourl.pathname;
    if (camino=='public/')
        camino='public/index.html';
    encaminar(pedido,respuesta,camino);
});
var port = process.env.PORT || 3000;
servidor.listen(port, () =>{
    console.log('Servidor iniciado en puerto 3000');
});
//mime es la variable para los formatos de los archivos a utilizar
var mime = {
    'html' : 'text/html',
    'css' : 'text/css', 
    'jpg' : 'image/jpg',
    'ico' : 'image/x-icon',
    'mp3' : 'audio/mpeg3',
    'mp4' : 'video/mp4'  
};
//se establecen las rutas para cada funcion
function encaminar (pedido,respuesta,camino) {
    switch (camino) {
    case 'public/creartabla': {
        crear(respuesta);
        break;
    }   
    case 'public/alta': {
        alta(pedido,respuesta);
        break;
    }           
    case 'public/listado': {
        listado(respuesta);
        break;
    }
    case 'public/consultaporcodigo': {
        consulta(pedido,respuesta);
        break;
    }                           
    default : {  
        fs.exists(camino,function(existe){
            if (existe) {
                fs.readFile(camino,function(error,contenido){
                    if (error) {
                        respuesta.writeHead(500, {'Content-Type': 'text/plain'});
                        respuesta.write('Error interno');
                        respuesta.end();                    
                    } else {
                        var vec = camino.split('.');
                        var extension=vec[vec.length-1];
                        var mimearchivo=mime[extension];
                        respuesta.writeHead(200, {'Content-Type': mimearchivo});
                        respuesta.write(contenido);
                        respuesta.end();
                    }
                });
            } else {
                respuesta.writeHead(404, {'Content-Type': 'text/html'});
                respuesta.write('<!doctype html><html><head></head><body>Recurso inexistente</body></html>');       
                respuesta.end();
            }
        }); 
    }
    }   
}
//se crea cada una de las funciones para conectar con la base de datos.
function crear(respuesta) {
    conexion.query('drop table if exists articulos',function (error,resultado){
        if (error)
        console.log(error);               
    }); 
    conexion.query('create table articulos ('+
                    'codigo int primary key auto_increment,'+
                    'descripcion varchar(50),'+
                    'precio float'+
                    ')', function (error,resultado){
        if (error) {
        console.log(error);               
        return;
        }  
    });
    respuesta.writeHead(200, {'Content-Type': 'text/html'});
    respuesta.write('<!doctype html><html><head></head><body>'+
                    'Se creo la tabla<br><a href="index.html">Retornar</a></body></html>');     
    respuesta.end();    
}
function alta(pedido,respuesta) {
    var info='';
    pedido.on('data', function(datosparciales){
        info += datosparciales;
    });
    pedido.on('end', function(){
        var formulario = querystring.parse(info);
    var registro={
        descripcion:formulario['descripcion'],
        precio:formulario['precio']
    };
    conexion.query('insert into articulos set ?',registro, function (error,resultado){
        if (error) {
            console.log(error);
            return;
        }   
    });       
    respuesta.writeHead(200, {'Content-Type': 'text/html'});
    respuesta.write('<!doctype html><html><head></head><body>'+
                    'Se cargo el articulo<br><a href="index.html">Retornar</a></body></html>');     
    respuesta.end();
    });     
}
function listado(respuesta) {
    conexion.query('select codigo,descripcion,precio from articulos', function(error,filas){
        if (error) {            
            console.log('error en el listado');
            return;
        }
        respuesta.writeHead(200, {'Content-Type': 'text/html'});
        var datos='';
        for(var f=0;f<filas.length;f++){
            datos+='Codigo:'+filas[f].codigo+'<br>';
            datos+='Descripcion:'+filas[f].descripcion+'<br>';
            datos+='Precio:'+filas[f].precio+'<hr>';
        }
        respuesta.write('<!doctype html><html><head></head><body>');
        respuesta.write(datos); 
        respuesta.write('<a href="index.html">Retornar</a>');
        respuesta.write('</body></html>');
        respuesta.end();        
    });
}
function consulta(pedido, respuesta) {
    var info = '';
    pedido.on('data', function(datosparciales){
        info += datosparciales;
    });
    pedido.on('end', function(){
        var formulario = querystring.parse(info);
        var dato=[formulario['codigo']];
        conexion.query('select descripcion, precio from articulos where codigo=?', dato, function(error, filas){
            if(error){
                console.log('error en la consulta');
                return;
            }
            respuesta.writeHead(200, {'Content-Type': 'text/html'});
            var datos='';
            if(filas.length>0){
                datos += 'Descripcion:'+filas[0].descripcion+'<br>';
                datos += 'Precio:'+filas[0].precio+'<hr>';
            }else{
                datos = 'No existe un articulo con dicho codigo';
            }
            respuesta.write('<!doctype html><html><head></head><body>');
            respuesta.write(datos);
            respuesta.write('<a href="index.html">Retornar</a>');
            respuesta.write('</body><html>');
            respuesta.end();
        })
    })
}

    