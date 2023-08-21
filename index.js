import express from 'express';
import { engine } from 'express-handlebars';
import bodyParser from 'body-parser';
import session from 'express-session';
import pgPromise from 'pg-promise';
import query from './service/query.js';


const pgp = pgPromise();

// should we use a SSL connection
let useSSL = false;
let local = process.env.LOCAL || false;
if (process.env.DATABASE_URL && !local) {
    useSSL = true;
}
// which db connection to use
const connectionString = process.env.DATABASE_URL || 'postgres://kat_spotter_user:xJXLsHuVOjgLdFVkmQwzy2EfYAEzNc8S@dpg-cjhibkj6fquc73c7fs9g-a/kat_spotter?ssl=true';

// console.log(connectionString);

const database = pgp(connectionString);

const data = query(database);

const app = express();
app.use(session({
    secret: 'keyboard cat5 run all 0v3r',
    resave: false,
    saveUninitialized: true
}));

app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './views');


app.use(express.static('public'));

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())


app.get('/add', function (req, res) {
    res.render('add');
})

app.post('/add', async function (req, res) {
    let catName = req.body.cat_name;
    if (catName && catName !== '') {
        await data.insert(catName)
    }

    res.redirect('/');
});

app.post('/spotted/:cat_id', async function (req, res) {
    let catId = req.params.cat_id;
    // console.log(catId);
    // get the current spottedCount from the database
    let results = await data.getCat(catId)
    let cat = results;
    let spottedCount = cat.spotted_count;
    spottedCount++;

    // put the updated value back into the db
    await data.update(catId);
    res.redirect('/');
});

app.get('/', async function (req, res) {
    let cats = await data.getAllCats();
    // console.log(cats);
    res.render('home', { cats });
});

const PORT = process.env.PORT || 3010;

app.listen(PORT, function () {
    console.log("started on: ", this.address().port);
});


