const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require("body-parser");

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// start

const UTCCorrection = "T00:00:00";

// data base
let db = [];


// objects
function User(userNameValue, idValue)
{
  this._id = idValue.toString(),
  this.username = userNameValue,
  this.exercises = [],
  this.log = new Log(this)
}

function UserBasicInfo(newUser)
{
  this._id = newUser._id.toString(),
  this.username = newUser.username
}

function UserFullInfo(user)
{
  this._id = user._id.toString(),
  this.username = user.username,
  //this.exercises = [ user.exercises.map(exercise => new ExerciseInfo(exercise)) ],
  this.log = {
    "count": Number(user.log.count),
    "log": user.log.log
  }
}

function Exercise(userNameValue, descriptionValue, durationValue, dateValue, idValue)
{
  this._id = idValue.toString(),
  this.username = userNameValue,
  this.date = (new Date(dateValue) == "Invalid Date") ? new Date().toDateString() : new Date(dateValue).toDateString(),
  this.duration = Number(durationValue),
  this.description = descriptionValue
}

function ExerciseInfo(exercise)
{
  this.description = exercise.description,
  this.duration = Number(exercise.duration),
  this.date = exercise.date
}

function Log(user)
{
  this._id =  user._id.toString(),
  this.username - user.username,
  this.count = Number(0),
  this.log = []
}


// methods
function DeepCopy(list)
{
  let newList = [];
  list.map(item => newList.push(new ExerciseInfo(item)));
  return newList;
}

function GetUserWithId(idValue)
{
  const currentUser = db.filter(user => (user._id == idValue))[0];
  return currentUser;
}

function AddNewUser(userNameValue, res)
{
  const newUser = new User(userNameValue, db.length);
  db.push(newUser);

  res.send(new UserBasicInfo(newUser));
}

function AddNewExerciseLogToUser(req, res)
{
  const currentId = req.params._id;
  const currentUser = GetUserWithId(currentId);

  let currentExercise;

  req.body.date += UTCCorrection;

  currentExercise = new Exercise(
    currentUser.username,
    req.body.description,
    req.body.duration,
    req.body.date,
    currentId
  )
  currentUser.exercises.push(currentExercise);
  const newExerciseInfo = new ExerciseInfo(currentExercise);
  currentUser.log.log.push(newExerciseInfo);
  currentUser.log.count = Number(currentUser.log.log.length);

  res.send(currentExercise);

}

function ListUsers(res)
{
  let newList = [];
  db.map(user => {
    newList.push(new UserBasicInfo(user));
  });
  res.send(newList);
}

function GetUserFullInfo(idValue, res)
{
  const currentUser = GetUserWithId(idValue);
  const userFullInfo = new UserFullInfo(currentUser);
  res.send(userFullInfo);
}

function GetUserExerciseLogs(req, res)
{
  const currentUser = GetUserWithId(req.params._id);
  
  let logList;

  if(req.query.from || req.query.to || req.query.limit)
  {
    let rawFrom;
    let rawTo;
    let limit = (req.query.limit) ? req.query.limit: currentUser.log.log.length;
    let itemsAdded = 0;

    logList = currentUser.log.log.filter(logItem => {
      const rawItemDate = new Date(logItem.date).getTime();

      rawFrom = (req.query.from) ? new Date(req.query.from + UTCCorrection).getTime() : rawItemDate;
      rawTo = (req.query.to) ? new Date(req.query.to + UTCCorrection).getTime() : rawItemDate;

      const validEntry = rawItemDate >= rawFrom && rawItemDate <= rawTo;

      if(validEntry)
      {
        itemsAdded ++;
      }
      
      return (validEntry && itemsAdded <= limit);
    })
  }
  else
  {
    logList = currentUser.log.log;
  }

  let mainLog = new Log(currentUser);  
  mainLog.log = (logList.length > 0) ? DeepCopy(logList) : [];
  mainLog.count = mainLog.log.length;
  
  res.send(mainLog);

}


// handlers
app.use(bodyParser.urlencoded({extended: false}));

app.post("/api/users", (req, res) => { AddNewUser(req.body.username, res); });

app.post("/api/users/:_id/exercises", (req, res) => { AddNewExerciseLogToUser(req, res); });

app.get("/api/users", (req, res) => { ListUsers(res); });

app.get("/api/users/:_id", (req, res) => { GetUserFullInfo(req.params._id, res); });

app.get("/api/users/:_id/logs", (req, res) => { GetUserExerciseLogs(req, res); });


// end




const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
