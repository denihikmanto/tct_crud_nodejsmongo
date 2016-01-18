var http = require('http');
	express = require('express');
	bodyParser = require('body-parser');
	path = require('path');
	MongoClient = require('mongodb').MongoClient,
	Server = require('mongodb').Server,
	CollectionDriver = require('./collectionDriver').CollectionDriver;

var app = express();
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(express.static(path.join(__dirname, 'public')));
app.locals.ucfirst = function(value){
    return value.charAt(0).toUpperCase() + value.slice(1);
};

var mongoHost = 'localHost';
var mongoPort = 27017;
var collectionDriver;
var mongoClient = MongoClient;
var url = 'mongodb://'+mongoHost+':'+mongoPort+'/buku';
mongoClient.connect(url, function(err,db){
	if(err) throw err;
	collectionDriver = new CollectionDriver(db);
});

app.get('/',function(req,res){
	res.set('Content-Type','application/json');
});

//render halaman untuk mengedit record
app.get('/:collection/edit/:entity', function(req, res) {
	var params = req.params;
	collectionDriver.get(params.collection, params.entity, function(error, objs) {
		if (error) { res.status(400).send({error: "error occured"}); }
		else {
			if (req.accepts('html')) {
				res.render('edit',{objects: objs, collection: params.collection});
			} else {
				res.set('Content-Type','application/json');
				res.status(200).send(objs);
			}
		}
	});
});

//render halaman untuk input record baru
app.get('/:collection/new', function(req, res) {
	var params = req.params;
	res.render('new',{collection: params.collection});
});


//ambil semua record
app.get('/:collection', function(req, res) {
	var params = req.params;
	var url = req.get('host');
	collectionDriver.findAll(params.collection, function(error, objs) {
		if (error) { res.status(400).send({error: "error occured"}); }
		else {
			if (req.accepts('html')) {
				res.render('list',{objects: objs, collection: params.collection, numberOfPages:0, baseurl:url});
			} else {
				res.set('Content-Type','application/json');
				res.status(200).send(objs);
			}
		}
	});
});


//ambil record dengan paginasi
app.get('/:collection/page/:page', function(req, res) {
	var params = req.params;
	var numEntity = 1;
	var numPages = 1;
	collectionDriver.count(params.collection, function(error, objs){
		if (error) { res.status(400).send({error: "error occured 1"}); }
		else {
			numEntity = objs;
			numPages = Math.ceil(numEntity/10);
			collectionDriver.findPage(params.collection, params.page, function(error, objs) {
				if (error) { res.status(400).send({error: "error occured 2"}); }
				else {
					if (req.accepts('html')) {
						res.render('list',{objects: objs, collection: params.collection, numberOfPages: numPages});
					} else {
						res.set('Content-Type','application/json');
						res.status(200).send(objs);
					}
				}
			});
		}
	});
});

//ambil detail record
app.get('/:collection/:entity', function(req, res) {
	var params = req.params;
	var entity = params.entity;
	var collection = params.collection;
	if (entity) {
		collectionDriver.get(collection, entity, function(error, objs) {
			if (error) { res.status(400).send({error: "error occured"}); }
			else {
				if (req.accepts('html')) {
					res.render('detail',{objects: objs, collection: collection});
				} else {
					res.status(200).send(objs);
				}
			}
		});
	} else {
		res.status(400).send({error: 'bad url', url: req.url});
	}
});

//menambah record
app.post('/:collection', function(req, res) {
    var object = req.body;
    var collection = req.params.collection;
    collectionDriver.save(collection, object, function(err,docs) {
          if (err) { res.status(400).send({error: "error occured"}); }
          else { res.redirect(''); }
     });
});

//mengupdate record
app.post('/:collection/edit/:entity', function(req, res) {
    var entity = req.params.entity;
    var collection = req.params.collection;
	var obyek = req.body;
    if (entity) {
       collectionDriver.update(collection, obyek, entity, function(error, objs) {
          if (error) { res.status(400).send({error: "error occured"}); }
		  else { res.redirect('/buku');}
       });
   } else {
       var error = { "message" : "Cannot PUT a whole collection" };
       res.status(400).send(error);
   }
});

//menghapus record
app.get('/:collection/delete/:entity', function(req, res) {
    var params = req.params;
    var entity = params.entity;
    var collection = params.collection;
    if (entity) {
       collectionDriver.delete(collection, entity, function(error, objs) {
          if (error) { res.status(400).send({error: "error occured"}); }
          else { res.redirect('/buku'); }
       });
   } else {
       var error = { "message" : "Cannot DELETE a whole collection" };
       res.status(400).send(error);
   }
});


app.use(function (req,res) {
    res.render('404', {url:req.url});
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
