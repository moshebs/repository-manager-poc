// __tests__/handler.test.js
const S3Utils = require('../util/s3Utils');
const fs = require('fs');
const req = require('request');
const AWS = require('aws-sdk');

const bucketName = "perfecto-repository-dev-us-east-1";
const objectPath = "testfolder/mytestartifact" + ((new Date()).getTime());

const TEST_FILE = './__tests__/test.txt';

var getUploadLinkResponse;
var getDownloadLinkResponse;

afterAll(async (done) => {
    deleteObject(false,bucketName,objectPath, done);
})

test('create upload link', () => {
    // get upload link
    getUploadLinkResponse = S3Utils.getUploadLink(bucketName,objectPath);
    expect(getUploadLinkResponse.statusCode).toBe(200);
});
    
test('use upload link', done => {
    
    const body = JSON.parse(getUploadLinkResponse.body);

    // use the link to upload artifact
    fs.readFile(TEST_FILE, function(err, data){
        if(err){
          return console.log(err);
        }
        req({
          method: "PUT",
          url: body.url,
          body: data
        }, function(err, res, body){
            expect(res.statusCode).toBe(200);
            console.log("err:" + JSON.stringify(err));
            console.log("res:" + JSON.stringify(res));
            console.log("body:" + JSON.stringify(body));
            // check object exists
            validateObjectExistance(true,bucketName,objectPath, done)
        })
      });
});

test('create download link', () => {
    getDownloadLinkResponse = S3Utils.getDownloadLink(bucketName,objectPath);
    expect(getUploadLinkResponse.statusCode).toBe(200);
});

test('use download link', done => {

    const body = JSON.parse(getDownloadLinkResponse.body);
    req({
        method: "GET",
        url: body.url
    }, function(err, res, body){
        expect(res.statusCode).toBe(200);
        console.log("err:" + JSON.stringify(err));
        console.log("res:" + JSON.stringify(res));
        //console.log("body:" + body);
        fs.readFile(TEST_FILE, 'utf8', function(err, data){
            if(err){
              return console.log(err);
            }
            expect(data).toBe(body);
            done();
        });
      })

});

// exists should be true or false, depending on whether you expect the object to exist or not
function validateObjectExistance(exists, bucketName, objectPath, done) {
    let s3 = new AWS.S3;
    var params = {
        Bucket: bucketName,
        Key: objectPath
    };
    var objectExists = false;
    s3.getObject(params, function (err, data) {
        if (err){
            console.log(err, err.stack); // an error occurred
        } else {
            objectExists = true;
            console.log(data);
        }
        expect(objectExists).toBe(exists);

        // this tells Jest that the asynchronous test has ended
        done();
    });
    
}

function deleteObject(throwErrorOnFailure, bucketName, objectPath, done){
    let s3 = new AWS.S3;
    var params = {
        Bucket: bucketName, 
        Key: objectPath
    };
    s3.deleteObject(params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            if (throwErrorOnFailure){
                throw new Error("Can't delete object")
            }
        }
        else{     
            console.log(JSON.stringify(data));           // successful response
            done();
        }
    });
}

