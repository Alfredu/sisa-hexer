var express = require('express');
var app = express();
var path = require('path');
var formidable = require('formidable');
var fs = require('fs');
var child_process = require('child_process');
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res){
  res.sendFile(path.join(__dirname, 'views/index.html'));
});
var uploadFolder = path.join(__dirname, '/uploads/');
app.get('/download', function(req, res){
  child_process.exec("tar -cvf uploads.tar *.hex", {cwd: uploadFolder}, function(err, stdout, stderr){
    if(err){
      console.log(err);
      res.send("Borro els codis quan ja shan baixat. Torna a provar i fes un F5 bueno");
    }
    else{
      res.download(path.join(__dirname, 'uploads/uploads.tar'), "codis.tar");
    }
  });

  res.on('finish', function(){
    child_process.exec("rm *.hex *.tar", {cwd: uploadFolder}, function(err, stdout, stderr){
      if(err){
        console.log(err);
      }
      else{
  
      }
    })
  })
  
})

app.post('/upload', function(req, res){

  // create an incoming form object
  var form = new formidable.IncomingForm();

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true;

  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/uploads');

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function(field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name));
  });

  // log any errors that occur
  form.on('error', function(err) {
    console.log('An error has occured: \n' + err);
  });

  // once all the files have been uploaded, send a response to the client
  form.on('end', function() {
    fs.readdir(form.uploadDir, (err, files) => {
      files.forEach(file => {
        var file_sans_extension = file.split(".")[0];
        var file_extension = file.split(".")[1];
        console.log(file_sans_extension, file_extension);
        if(file_extension == 's'){
          child_process.exec('sisa-as '+path.join(form.uploadDir, file)+" -o "+file_sans_extension+".out", {cwd: form.uploadDir}
            , function(err, stdout, stderr){
            if(err){
              res.end("liada");
              console.log(err);
            }
            else{
              child_process.exec('sisa-objcopy -O binary -j .text ' + file_sans_extension+".out "+ file_sans_extension+".dump", {cwd: form.uploadDir},
                function(err, stdout, stderr){
                if(err){
                  console.log(err);
                }
                else{
                  child_process.exec('od -An -w2 -x '+file_sans_extension+".dump" + " > "+file_sans_extension+".hex", {cwd: form.uploadDir},function(err, stdout, stderr){
                    if(err){
                      console.log(err);
                    }
                    else{
                      child_process.exec("sed -i -e 's/ //' "+file_sans_extension+".hex", {cwd: form.uploadDir}, function(err, stdout, stderr){
                        if(err){
                          console.log(err);
                        }
                        else{
                          child_process.exec("rm "+file_sans_extension+".dump "+file_sans_extension+".out "+file_sans_extension+".s ", {cwd: form.uploadDir}, function(err, stdout, stderr){
                            if(err){
                              console.log(err);
                            }
                          })
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    })
    res.send("success");
  });

  // parse the incoming request containing the form data
  form.parse(req);

});

var server = app.listen(3000, function(){
  console.log('Server listening on port 3000');
});
