var PROTO_PATH = __dirname + '/../protos/convertwordtopdf.proto';

var fs = require("fs");

var grpc = require('@grpc/grpc-js');
var protoLoader = require('@grpc/proto-loader');
var packageDefinition = protoLoader.loadSync(
    PROTO_PATH,
    {keepCase: true,
     longs: String,
     enums: String,
     defaults: true,
     oneofs: true
    });
var converter = grpc.loadPackageDefinition(packageDefinition).ConvertDoc;

var client = new converter.ConvertDocxToPdfService('localhost:50051', grpc.credentials.createInsecure());

function sendDocxConvert(nameFile) {
  const DocxConverter = client.ConvertDocxToPdf();

  const readStream = fs.createReadStream(`${__dirname}/../tmp/${nameFile}`);
        
  readStream
    .on("data", chunk => DocxConverter.write({chunk}))
    .on("end", () => DocxConverter.end());

  DocxConverter
    .on("data", async ({ chunk }) => fs.appendFileSync(`${__dirname}/../tmp/${nameFile.replace( /docx$/, "pdf")}`, chunk));
}

function main() {
  const dir = `${__dirname}/../tmp/`;

  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
  }

  fs.readdir(dir, async (err, files) => {
    if(!files){
      console.log("Pasta Tmp inexistente");
      return;
    } 
    
    if(files.length === 0 ){
      console.log(`Arquivos .docx inexistentes em: ${__dirname.replace("client", "tmp")}`);
      return;
    }

    const docsToConvert = await files.filter(el => /docx$/.test(el));
    
    docsToConvert.map(async el => {
      await sendDocxConvert(el);
    });
  });
}

main();

exports.sendDocxConvert = sendDocxConvert;