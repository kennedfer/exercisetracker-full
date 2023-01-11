const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
  username: String,
  exercises: [{ type: Object }]
});
const UserModel = new mongoose.model('users', userSchema);

// const exerciseSchema = new mongoose.Schema({
//   _id: String,
//   description: String,
//   duration: Number,
//   date: String //yyyy-mm-dd
// });
// const ExerciseModel = new mongoose.model('exercises', exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


//post new user
app.post('/api/users', (req, res) => {

  let user = new UserModel({ username: req.body.username });
  user.save((err, data) => {
    if (err) return console.log(err);

    res.json(data);
  });
});
//end post new user

//get all users
app.get('/api/users', (req, res) => {
  //show only id and username
  UserModel.find({}, (err, users) => {
    if (err) return console.log(err);

    res.json(users);
  });
});
//end get all users

app.post('/api/users/:_id/exercises', (req, res) => {
  // console.log(req.body);
  // console.log(req.body['_id']);
  let requestBody = req.body;
  let date = (requestBody.date == undefined) ? new Date(Date.now()) : new Date(requestBody.date);

  // var datestring = date.getFullYear()+"-"+(date.getMonth()+1)+date.getDay()

  console.log(date.toDateString());
  
  let exercise = {
    _id: requestBody[':_id'],
    description: requestBody.description,
    duration: parseInt(requestBody.duration),
    date: date.toDateString()
  };

  //console.log(typeof (exercise.date));

  UserModel.findOne({ _id: req.params._id }, (err, user) => {
    if (err) return console.log(err);

    user.exercises.push(exercise);
    user.save((err, user) => {
      if (err) return console.log(err);

      // res.json({
      //   "_id":user._id,
      //   "username":user.username,
      //   "date":exercise.date,
      //   "duration":exercise.duration,
      //   "description":exercise.description});
      // 

      let resp = {
        username: user.username,
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date,
        _id: user._id
        // exercises: user.exercises
      };

      console.log(resp);
      res.json(resp);
    });
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  //console.log('estamos ao vivo ' + req.query);
  let fromTimestamp = 0;
  let toTimestamp = Date.now();
  let query = req.query;

  UserModel.findById(req.params._id, (err, user) => {
    if (err) return console.log(err);

    if(query.limit){
      return res.json({ count: query.limit, log: user.exercises.slice(0, query.limit) });
    }

    if (query.from !== undefined) {
      fromTimestamp = new Date(query.from).getTime();
      toTimestamp = new Date(query.to).getTime();
    } else {
      ////////console.log('meu query n existe');
      return res.json({ count: user.exercises.length, log: user.exercises });
    }

    let logsFiltered = [];

    logsFiltered = user.exercises.filter(exe => Date.parse(exe.date) > fromTimestamp) &&  user.exercises.filter(exe => Date.parse(exe.date) < toTimestamp);
    // user.exercises.forEach(log => {
    //   let logTimestamp = Date.parse(log.date);
    //   if (logTimestamp > fromTimestamp && logTimestamp < toTimestamp) {
    //     logsFiltered.push(log);
    //     console.log('no filtro');
    //   }
    // });

    // console.log(logsFiltered);
    res.json({ count: logsFiltered.length, log: logsFiltered });
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  // UserModel.findById(req.params._id, (err, user) => {
  //   if (err) return console.log(err);

  //   res.json({ count: user.exercises.length, log: user.exercises });
  // });
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
