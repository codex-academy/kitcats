const query = (db) => {

    const insert = async catName => {
        let checkCat = await db.oneOrNone('select id from cats where cat_name = $1', [catName]);
        if (checkCat == null) {
            await db.none('insert into cats (cat_name, spotted_count) values ($1, $2)', [catName, 1]);
        } else {
            await update(checkCat.id);
        }
    }

    const update = async (catId) => {
        await db.none('update cats set spotted_count = spotted_count + 1 where id = $1',
            [catId]);
    }

    const getAllCats = async () => {
        let results = await db.manyOrNone('select * from cats order by spotted_count desc');
        return results;
    }

    const getCat = async (catId) => {
        let results = await db.oneOrNone('select spotted_count from cats where id = $1', [catId]);
        return results
    }

    return {
        insert,
        update,
        getAllCats,
        getCat
    }

}

export default query;