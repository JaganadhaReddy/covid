const express = require("express");
const app = express();
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());

let db = null;

const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost/3000/");
    });
  } catch (error) {
    console.log(`DB error:${error.message}`);
    process.exit(1);
  }
};
intializeDBAndServer();

const convertStateJSONtoResponseJson = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDistrictObjecttoResponseJSON = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

app.get("/states/", async (request, response) => {
  const allStates = `
    SELECT * FROM state;`;
  const statesList = await db.all(allStates);
  response.send(
    statesArray.map((eachState) =>
      convertStateDbObjectToResponseObject(eachState)
    )
  );
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateQuery = `
    SELECT * FROM state
    WHERE state_id = ${stateId};`;
  const state = await db.get(stateQuery);
  response.send(convertStateJSONtoResponseJson(state));
});

app.post("/districts/", async (request, response) => {
  const { stateId, districtName, cases, cured, active, deaths } = request.body;
  const AddDistrict = `
    INSERT INTO districts(district_name, district_id, cases, cured, active,deaths)
    VALUES(${stateId}, '${districtName}', ${cases}, ${cured}, ${active},${deaths});`;
  await db.run(AddDistrict);
  response.send("District Successfully Added");
});

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtQuery = `
    SELECT * FROM district
    WHERE district_id = ${districtId};`;
  const district = await db.get(districtQuery);
  response.send(convertDistrictObjecttoResponseJSON(district));
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrict = `
    DELETE FROM district
    WHERE movie_id = ${districtId};`;
  await db.run(deleteDistrict);
  response.send("District Removed");
});

app.put("/districts/districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrict = `
    UPDATE district
    SET district_name = '${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        active = ${active},
        deaths = ${deaths}
    WHERE district_id = ${districtId};`;
  await db.run(updateDistrict);
  response.send("District Details Updated");
});

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const statesQuery = `
    SELECT 
        sum(cases) as totalCases,
        sum(cured) as totalCured,
        sum(active) as totalActive,
        sum(deaths) as totalDeaths
    FROM district
    WHERE state_id = ${stateId};`;
  const TotalQuery = await db.all(statesQuery);
  response.send({
    totalCases: stats["sum(cases)"],
    totalCured: stats["sum(cured)"],
    totalActive: stats["sum(active)"],
    totalDeaths: stats["sum(deaths)"],
  });
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const stateNameQuery = `
    SELECT state_name
    FROM state inner join district on state.state_id = district.state_id
    WHERE district_id = ${districtId};`;
  const state = await db.all(stateNameQuery);
  response.send({ stateName: state.state_name });
});

module.exports = app;
