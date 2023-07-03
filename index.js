import  express  from 'express';
import { engine } from 'express-handlebars';
import bodyParser from 'body-parser';
import session from 'express-session';
import pgPromise from 'pg-promise';

const pgp = pgPromise();

// should we use a SSL connection
let useSSL = false;
let local = process.env.LOCAL || false;
if (process.env.DATABASE_URL && !local) {
    useSSL = true;
}
// which db connection to use
const connectionString = process.env.DATABASE_URL || 'postgresql://coder:pg123@localhost:5432/kitcats';

const db = pgp(connectionString);

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
        await db.none('insert into cats (cat_name, spotted_count) values ($1, $2)', [catName, 1]);
    }

    res.redirect('/');
});

app.post('/spotted/:cat_id', async function (req, res) {
    let catId = req.params.cat_id;

    // get the current spottedCount from the database
    let results = await db.oneOrNone('select spotted_count from cats where id = $1', [catId]);
    let cat = results;
    let spottedCount = cat.spotted_count;
    spottedCount++;

    // put the updated value back into the db
    await db.none('update cats set spotted_count = $1 where id = $2',
        [spottedCount, catId]);

    res.redirect('/');
});

app.get('/', async function (req, res) {

    let results = await db.manyOrNone('select * from cats order by spotted_count desc');
    let cats = results;
    res.render('home', { cats });
});

const PORT = process.env.PORT || 3010;

app.listen(PORT, function () {
    console.log("started on: ", this.address().port);
});
