var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

const fs = require('fs');
const path = require('path');

const mysql = require('mysql');

app.use(express.static('public'));

//**********VARIABLES**********************
let flag = 0;
let dataArray = [];
//let fileCount = 1;

//************BASE DE DATOS****************
const conn = mysql.createConnection({
    host: '',
    user: 'root',
    password: 'mcjosue26',
    database: 'datosECG'
});

conn.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos: ', err);
    } else {
        console.log('Conexión exitosa a la base de datos');
    }
});

conn.query('SELECT MAX(id) AS max_id FROM timestamps', function (err, results, fields) {
    if (err) throw err;
    console.log("El ultimo ID registrado es: "+results[0].max_id);
    fileCount = results[0].max_id+1;
  });
//***************************************

//***************CONEXION SERVIDOR (SOCKETs) *******/
io.on('connection', function(socket){
	socket.on('nuevo_mensaje', function(data){
		//console.log(data);//Recibe datos ****
		io.sockets.emit('desde_servidor',data);

        if (flag == 1){
            dataArray.push(data);
          } 
      
        // 
        if (flag == 2){
        const fileName = `datos_${fileCount}.txt`;
        const folderPath = './archivos';
        saveDataAsTextFile(dataArray.join('\n'),fileName,folderPath);
        dataArray = [];
        flag = 0;
        console.log(`Archivo ${fileName} guardado en la carpeta ${folderPath}`);
        
        // Guarda la info en la base de datos
        const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
        saveTimestamp(fileCount, fileName, timestamp, folderPath);
        fileCount++;
        }
        //console.log(flag);
	});
	//io.sockets.emit('desde_servidor',"hola");
    socket.on('flag', function(data){
        console.log(data);
        flag = data;
    });    
});

server.listen(5001, function(){
	console.log('Servidor corriendo en el puerto 5001.');
});
//***************************************

//*************FUNCIONES*******************
function saveDataAsTextFile(data, fileName, folderPath) {
// Comprobar si esta la carpeta si no la crea
if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
}
// crar la direccion y lo guarda
const filePath = path.join(folderPath, fileName);
fs.writeFileSync(filePath, data);
}

function saveTimestamp(id, fileName, timestamp, location) {
    const query = `INSERT INTO timestamps (id, file_name, timestamp, location) VALUES (?, ?, ?, ?)`;
    
    conn.query(query, [id, fileName, timestamp, location], (err, result) => {
        if (err) {
            console.error('Error al guardar el timestamp: ', err);
        } else {
            console.log(`Timestamp guardado con éxito: ${id}, ${fileName}, ${timestamp}, ${location}`);
        }
    });
    
}

    //Funcion para guardar el archivo txt con los datos recibidos
  /*function saveDataAsTextFile(text) {
    const fileName = `datos_${fileCount}.txt`;
    const fileType = 'text/plain;charset=utf-8';
    const fileBlob = new Blob([text], { type: fileType });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(fileBlob);
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }*/