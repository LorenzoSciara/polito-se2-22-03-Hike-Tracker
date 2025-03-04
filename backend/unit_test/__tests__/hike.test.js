const HikeDao = require('../../api/DAOs/hikeDAO');
const { resetGroups, resetHistory, resetHikes } = require('../../db/dbreset');
const SECONDS = 1000;
jest.setTimeout(10 * SECONDS);

describe('Hikes Unit tests', () => {
    beforeEach(async () => {
        await resetHikes();
    });

    test('createHike should create a new entry in the Db and return status 201', async () => {
        const newHike = {
            "id": 3,
            "title": "Sentiero per il Rocciamelone",
            "length": 1273.2,
            "expTime": 10.2,
            "ascent": 1000.0,
            "difficulty": "pro",
            "startPt": 1,
            "endPt": 2,
            "description": "test description",
            "author": "maurizio.merluzzo@donkeykong.com"
        };
        const res = await HikeDao.createHike(newHike);
        return expect(res.id !== undefined).toBe(true)
    });

    test('getHikes should retrieve the complete list of hikes in the database', async () => {
        const newHike = {
            "id": 2,
            "title": "Sentiero per il Rocciamelone",
            "length": 1273.2,
            "expTime": 10.2,
            "ascent": 1000.0,
            "difficulty": "pro",
            "startPt": 1,
            "endPt": 2,
            "description": "test description",
            "author": "maurizio.merluzzo@donkeykong.com"
        };

        await HikeDao.createHike(newHike);
        const hikes = await HikeDao.getHikes({page:0});
        return expect(hikes.length).toBe(2);
    })

    test('getHikesByHutId should retrieve the correct hike related to the hutworker', async () => {
        const hikelist = [{
            "description": "mud slide on the main bridge",
            "id": 1,
            "status": "closed",
            "title": "Sentiero per il Rocciamelone"
        }];

        const hikes = await HikeDao.getHikesByHutId(1, "jen.shiro@chiocciola.it");
        return expect(hikes).toEqual(hikelist);
    })

    test('updateStatus should correctly update the status of a hike related to a hut, but only if the user owns it', async () => {
        const status = {
            "description": "mud slide on the main bridge",
            "status": "closed",
        };

        const res = await HikeDao.updateStatus(status, 1, 1, "jen.shiro@chiocciola.it");
        return expect(res).toBe(200);
    })

    test('updateStatus should return 404 if the user doesn\'t own it', async () => {
        const status = {
            "description": "mud slide on the main bridge",
            "status": "closed",
        };

        await HikeDao.updateStatus(status, 1, 1, "not the owner's email").catch((e)=>{
            return expect(e).toBe(404);
        });
    })

    test('addHikePhoto should update the entry in the Db and return status 201', async () => {
        const newHike = {
            "title": "Sentiero per il Rocciamelone",
            "length": 1273.2,
            "expTime": 10.2,
            "ascent": 1000.0,
            "difficulty": "pro",
            "startPt": 1,
            "endPt": 2,
            "description": "test description",
            "author": "maurizio.merluzzo@donkeykong.com"
        };
        const id = await HikeDao.createHike(newHike);

        const res = await HikeDao.addHikePhoto(id.id, "MountainTops.nft")
        return expect(res).toBe(201)
    });

    test('addHikePhoto should fail to update the entry in the Db when the hike doesn\'t exist and return status 400', async () => {
        await HikeDao.addHikePhoto(3, "MountainTops.nft").catch(e=>{
            return expect(e).toBe(404)
        })
       return false
    });
})

describe('Hike groups Unit tests', () => {
    beforeEach(async () => {
        await resetGroups();
        await resetHistory();
    });

    test('start hike should create a new entry in table HikesHistory and in Participants', async () => {
        const hikeId = 1
        const userId = "maurizio.merluzzo@donkeykong.com"
        const res = await HikeDao.startHike(hikeId, userId)
        return expect(res).toBe(true)
    });

    test('start hike should fail if the user is already in another hike', async () => {
        const hikeId = 1
        const userId = "maurizio.merluzzo@donkeykong.com"
        await HikeDao.startHike(hikeId, userId)
        await HikeDao.startHike(hikeId, userId).catch(e => {
            return expect(e).toEqual(404)
        })
        return false
    });

    test('start hike should fail if the user does not exist', async () => {
        const hikeId = 1
        const userId = "pinguino.imperatore@royals.eu"
        await HikeDao.startHike(hikeId, userId).catch(e => {
            return expect(e).toEqual(503)
        })
        return false
    });

    test('terminate hike should mark as "completed" the entry in table HikesHistory', async () => {
        const groupId = 1
        const hikeId = 1
        const userId = "maurizio.merluzzo@donkeykong.com"
        const res1 = await HikeDao.startHike(hikeId, userId)
        expect(res1).toBe(true)

        const res2 = await HikeDao.terminateHike(groupId, hikeId, userId)
        return expect(res2).toBe(true)
    });

    test('terminate hike should fail if the group id is wrong', async () => {
        const groupId = 1719
        const hikeId = 1
        const userId = "maurizio.merluzzo@donkeykong.com"
        const res1 = await HikeDao.startHike(hikeId, userId)
        expect(res1).toBe(true)

        await HikeDao.terminateHike(groupId, hikeId, userId).catch(e => {
            return expect(e).toEqual(403)
        })
        return false
    });

    test('terminate hike should fail if the hike is not ongoing', async () => {
        const groupId = 1
        const hikeId = 1
        const userId = "maurizio.merluzzo@donkeykong.com"
        const res1 = await HikeDao.startHike(hikeId, userId)
        expect(res1).toBe(true)

        const res2 = await HikeDao.terminateHike(groupId, hikeId, userId)
        expect(res2).toBe(true) //correct termination

        await HikeDao.terminateHike(groupId, hikeId, userId).catch(e => {
            return expect(e).toEqual(400) //cannot terminate twice
        })
        return false
    });

    test('terminate hike should fail if the user is not in the ongoing hike group', async () => {
        const groupId = 1
        const hikeId = 1
        const userId = "maurizio.merluzzo@donkeykong.com"
        const wrongUserId = "pinguino.imperatore@royals.eu"
        const res1 = await HikeDao.startHike(hikeId, userId)
        expect(res1).toBe(true)

        await HikeDao.terminateHike(groupId, hikeId, wrongUserId).catch(e => {
            return expect(e).toEqual(403)
        })
        return false
    });

    test('getting the current group should return all the info related to it', async () => {
        const groupId = 1
        const hikeId = 1
        const userId = "maurizio.merluzzo@donkeykong.com"
        const res1 = await HikeDao.startHike(hikeId, userId)
        expect(res1).toBe(true)

        const res2 = await HikeDao.getCurrentGroupDataByHikerId(userId)
        expect(res2).toEqual(
            {
                "groupId": groupId,
                "hikeId": hikeId
            })
    });

    test('getting the current group should resolve false if the user is not in an ongoing hike', async () => {
        const groupId = 1
        const hikeId = 1
        const userId = "maurizio.merluzzo@donkeykong.com"
        const res1 = await HikeDao.startHike(hikeId, userId)
        expect(res1).toBe(true)

        const res2 = await HikeDao.terminateHike(groupId, hikeId, userId)
        expect(res2).toBe(true)

        const res3 = await HikeDao.getCurrentGroupDataByHikerId(userId)
        expect(res3).toBe(false)
    });

    test('getting the current group should resolve false if the user is not in any hike', async () => {
        const userId = "maurizio.merluzzo@donkeykong.com"

        const res3 = await HikeDao.getCurrentGroupDataByHikerId(userId)
        expect(res3).toBe(false)
    });

    test('getting the completed hikes should resolve the hike object of the completed hikes based on the passed email', async () => {
        const groupId = 1
        const hikeId = 1
        const userId = "maurizio.merluzzo@donkeykong.com"

        const res1 = await HikeDao.startHike(hikeId, userId)
        expect(res1).toBe(true)

        const res2 = await HikeDao.terminateHike(groupId, hikeId, userId)
        expect(res2).toBe(true)

        const res3 = await HikeDao.getCompletedHikes(userId)
        expect(res3[0].id == 1).toBe(true)
        expect(res3[0].difficulty == 'pro').toBe(true)
        expect(res3[0].title == 'Sentiero per il Rocciamelone').toBe(true)
    });

    test('getting the completed hikes should resolve [] if there aren\'t any', async () => {
        const userId = "maurizio.merluzzo@donkeykong.com"

        const res = await HikeDao.getCompletedHikes(userId)
        expect(res).toEqual([])
    });

    test('getting the completed hikes should resolve [] if the user is part of a group but the hike is not completed', async () => {
        const groupId = 1
        const hikeId = 1
        const userId = "maurizio.merluzzo@donkeykong.com"

        const res1 = await HikeDao.startHike(hikeId, userId)
        expect(res1).toBe(true)

        const res2 = await HikeDao.getCompletedHikes(userId)
        expect(res2).toEqual([])
    });
})