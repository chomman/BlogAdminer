var fs = require('fs');
exports.install = function () {
	F.route('/', homepage);
	F.route('/', login, ['post', '*User']);
	F.route('/', articles, ['authorize']);
	F.route('/article/{id}', article, ['authorize']);
	F.route('/remove/{id}', remove , ['authorize']);
	F.route('/update/{id}', update, ['authorize', 'post', 'upload', 10000], 3084);
	F.route('/create', create, ['authorize', 'post', 'upload', 10000], 3084);
	F.route('/logout', logout, ['authorize']);
};

function homepage() {
	var self = this;
	self.view('homepage');
}

function login() {
	var self = this;
	self.body.$workflow('login', self, self.callback());
}

function articles() {

	var self = this;
	var articles = DATABASE('articles');

	articles.find({}).toArray(function (err, docs) {
		self.view('articles', docs);
	});
}

function article(id) {
	var self = this;
	var articles = DATABASE('articles');
	id = parseInt(id);

	articles.find({"_id": id}).toArray(function (err, doc) {
		self.view('article', doc[0]);
	});
}

function update(id) {
	var self = this;
	id = parseInt(id);

	var articles = DATABASE('articles');
	if (self.files.length > 0) {
		var file = self.files[0];
		fs.readFile(file.path, function (err, data) {
			var imageName = file.filename;
			if (!imageName) {
				console.log("There was an error");
			} else {
				var newPath = "public/uploads/" + imageName;
				fs.writeFile(newPath, data, function (err) {
					if (err) {
						console.log(err);
					}
					articles.update({"_id": id}, {
						$set: {
							"image_url": imageName
						}
					});
				});
			}
		});
	}

	articles.update({"_id": id}, {
		$set: {
			"title": self.body.title,
			"description": self.body.description,
			"content": self.body.content
		}
	});
	self.redirect('/article/' + id);
}
function remove(id) {
	var self = this;
	var articles = DATABASE('articles');
	id = parseInt(id);
	articles.remove({"_id": id});
	self.redirect('/');
}

function create() {
	var self = this;
	var image_url = '';
	if (self.files.length > 0) {
		var file = self.files[0];
		fs.readFile(file.path, function (err, data) {
			var imageName = file.filename;
			if (!imageName) {
				console.log("There was an error");
			} else {
				var newPath = "public/uploads/" + imageName;
				fs.writeFile(newPath, data, function (err) {
					if (err) {
						console.log(err);
					}
					image_url = imageName;
				});
			}
		});
	}

	var articles = DATABASE('articles');
	articles.find({}).sort({_id: -1}).limit(1).toArray(function (err, doc) {
		id = parseInt(doc[0]._id) + 1;
		self.body._id = id;
		self.body.created = Date.now();
		self.body.image_url = image_url;
		articles.insert(self.body);
		self.redirect('/');
	});
}

function logout() {
	var self = this;
	self.res.cookie(F.config.cookie, '', new Date().add('-1 year'));
	self.redirect('/');
}
