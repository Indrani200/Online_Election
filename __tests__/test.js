const request = require("supertest");
const cheerio = require("cheerio");
const db = require("../models/index");
const app = require("../app");

let server, agent;

function extractCsrfToken(res) {
  var $ = cheerio.load(res.text);
  return $("[name=_csrf]").val();
}

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCsrfToken(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Online voting application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(4000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Sign up", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCsrfToken(res);
    res = await agent.post("/admin").send({
      Firstname: "Test",
      Lastname: "golla",
      Email: "user.b@gmail.com",
      password: "ashish",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign in", async () => {
    const agent = request.agent(server);
    let res = await agent.get("/elections");
    expect(res.statusCode).toBe(302);
    await login(agent, "user.b@gmail.com", "ashish");
    res = await agent.get("/elections");
    expect(res.statusCode).toBe(200);
  });

  test("Sign out", async () => {
    let res = await agent.get("/elections");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/elections");
    expect(res.statusCode).toBe(302);
  });

  test("Creating a election", async () => {
    const agent = request.agent(server);
    await login(agent, "user.b@gmail.com", "ashish");
    const res = await agent.get("/elections/create");
    const csrfToken = extractCsrfToken(res);
    const response = await agent.post("/elections").send({
      electionName: "Test election",
      _csrf: csrfToken,
    });
    console.log(response);
    expect(response.statusCode).toBe(302);
  });

  test("Adding a question", async () => {
    const agent = request.agent(server);
    await login(agent, "user.b@gmail.com", "ashish");

    //Create a New Election
    let res = await agent.get("/elections/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "Class Leader",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const electionCount = parsedGroupedResponse.elections.length;
    const latestElection = parsedGroupedResponse.elections[electionCount - 1];

    //add a question to the election
    res = await agent.get(`/elections/${latestElection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    let response = await agent
      .post(`/elections/${latestElection.id}/questions/create`)
      .send({
        question: "who is Leader",
        description: "choose",
        _csrf: csrfToken,
      });
    expect(response.statusCode).toBe(302);
  });

  test("Deleting a question", async () => {
    const agent = request.agent(server);
    await login(agent, "user.b@gmail.com", "ashish");

    //Create a New Election
    let res = await agent.get("/elections/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "Class Head",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedElectionsResponse = JSON.parse(
      groupedElectionsResponse.text
    );
    const electionCount = parsedGroupedElectionsResponse.elections.length;
    const latestElection =
      parsedGroupedElectionsResponse.elections[electionCount - 1];

    //add a question to the election
    res = await agent.get(`/elections/${latestElection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${latestElection.id}/questions/create`).send({
      question: "Test question 1",
      description: "Test description 1",
      _csrf: csrfToken,
    });

    res = await agent.get(`/elections/${latestElection.id}/questions/create`);
    console.log(res.text);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${latestElection.id}/questions/create`).send({
      question: "who is nani",
      description: "choose from option",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionCount = parsedQuestionsGroupedResponse.questions.length;
    const latestQuestion =
      parsedQuestionsGroupedResponse.questions[questionCount - 1];

    res = await agent.get(`/elections/${latestElection.id}/questions`);
    csrfToken = extractCsrfToken(res);
    const deleteResponse = await agent
      .delete(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeleteResponse = JSON.parse(deleteResponse.text).success;
    expect(parsedDeleteResponse).toBe(true);

    res = await agent.get(`/elections/${latestElection.id}/questions`);
    csrfToken = extractCsrfToken(res);

    const deleteResponse2 = await agent
      .delete(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeleteResponse2 = JSON.parse(deleteResponse2.text).success;
    expect(parsedDeleteResponse2).toBe(false);
  });

  test("Updating a question", async () => {
    const agent = request.agent(server);
    await login(agent, "user.b@gmail.com", "ashish");

    //Create a New Election
    let res = await agent.get("/elections/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "Election",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedElectionsResponse = JSON.parse(
      groupedElectionsResponse.text
    );
    const electionCount = parsedGroupedElectionsResponse.elections.length;
    const latestElection =
      parsedGroupedElectionsResponse.elections[electionCount - 1];

    //add a question to the election
    res = await agent.get(`/elections/${latestElection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${latestElection.id}/questions/create`).send({
      question: "question 5",
      description: "description 5",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionCount = parsedQuestionsGroupedResponse.questions.length;
    const latestQuestion =
      parsedQuestionsGroupedResponse.questions[questionCount - 1];

    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}/edit`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent.put(`/questions/${latestQuestion.id}/edit`).send({
      _csrf: csrfToken,
      question: "011618",
      description: "0122",
    });
    expect(res.statusCode).toBe(200);
  });

  test("Adding a option to the question", async () => {
    const agent = request.agent(server);
    await login(agent, "user.b@gmail.com", "ashish");

    //create new election
    let res = await agent.get("/elections/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "Test election",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const electionCount = parsedGroupedResponse.elections.length;
    const latestElection = parsedGroupedResponse.elections[electionCount - 1];

    //add a question to the election
    res = await agent.get(`/elections/${latestElection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${latestElection.id}/questions/create`).send({
      question: "who is class teacher",
      description: "findout the class teacher",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionCount = parsedQuestionsGroupedResponse.questions.length;
    const latestQuestion =
      parsedQuestionsGroupedResponse.questions[questionCount - 1];

    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}`
    );
    csrfToken = extractCsrfToken(res);

    res = await agent
      .post(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
      .send({
        _csrf: csrfToken,
        option: "Test option",
      });
    expect(res.statusCode).toBe(302);
  });

  test("Deleting a option for the required question", async () => {
    const agent = request.agent(server);
    await login(agent, "user.b@gmail.com", "ashish");

    //Create a  New Election
    let res = await agent.get("/elections/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "Test election",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedElectionsResponse = JSON.parse(
      groupedElectionsResponse.text
    );
    const electionCount = parsedGroupedElectionsResponse.elections.length;
    const latestElection =
      parsedGroupedElectionsResponse.elections[electionCount - 1];

    //add a question to the election
    res = await agent.get(`/elections/${latestElection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${latestElection.id}/questions/create`).send({
      question: "question 22",
      description: "description 22",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionCount = parsedQuestionsGroupedResponse.questions.length;
    const latestQuestion =
      parsedQuestionsGroupedResponse.questions[questionCount - 1];

    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
      .send({
        _csrf: csrfToken,
        option: "nani 011618",
      });

    const groupedOptionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
      .set("Accept", "application/json");
    const parsedOptionsGroupedResponse = JSON.parse(
      groupedOptionsResponse.text
    );
    console.log(parsedOptionsGroupedResponse);
    const optionsCount = parsedOptionsGroupedResponse.options.length;
    const latestOption = parsedOptionsGroupedResponse.options[optionsCount - 1];

    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    const deleteResponse = await agent
      .delete(`/options/${latestOption.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeleteResponse = JSON.parse(deleteResponse.text).success;
    expect(parsedDeleteResponse).toBe(true);

    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    const deleteResponse2 = await agent
      .delete(`/options/${latestOption.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeleteResponse2 = JSON.parse(deleteResponse2.text).success;
    expect(parsedDeleteResponse2).toBe(false);
  });

  test("Updating a option", async () => {
    const agent = request.agent(server);
    await login(agent, "user.b@gmail.com", "ashish");

    //Create a New Election
    let res = await agent.get("/elections/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "Who is Nani",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedElectionsResponse = JSON.parse(
      groupedElectionsResponse.text
    );
    const electionCount = parsedGroupedElectionsResponse.elections.length;
    const latestElection =
      parsedGroupedElectionsResponse.elections[electionCount - 1];

    //add a question to the election
    res = await agent.get(`/elections/${latestElection.id}/questions/create`);
    csrfToken = extractCsrfToken(res);
    await agent.post(`/elections/${latestElection.id}/questions/create`).send({
      question: "select nani",
      description: "choose from options",
      _csrf: csrfToken,
    });

    const groupedQuestionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions`)
      .set("Accept", "application/json");
    const parsedQuestionsGroupedResponse = JSON.parse(
      groupedQuestionsResponse.text
    );
    const questionCount = parsedQuestionsGroupedResponse.questions.length;
    const latestQuestion =
      parsedQuestionsGroupedResponse.questions[questionCount - 1];

    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}`
    );
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
      .send({
        _csrf: csrfToken,
        option: "nani",
      });

    const groupedOptionsResponse = await agent
      .get(`/elections/${latestElection.id}/questions/${latestQuestion.id}`)
      .set("Accept", "application/json");
    const parsedOptionsGroupedResponse = JSON.parse(
      groupedOptionsResponse.text
    );
    console.log(parsedOptionsGroupedResponse);
    const optionsCount = parsedOptionsGroupedResponse.options.length;
    const latestOption = parsedOptionsGroupedResponse.options[optionsCount - 1];

    res = await agent.get(
      `/elections/${latestElection.id}/questions/${latestQuestion.id}/options/${latestOption.id}/edit`
    );
    csrfToken = extractCsrfToken(res);

    res = await agent.put(`/options/${latestOption.id}/edit`).send({
      _csrf: csrfToken,
      option: "testoption",
    });
    expect(res.statusCode).toBe(200);
  });

  test("Adding voter to participate", async () => {
    const agent = request.agent(server);
    await login(agent, "user.b@gmail.com", "ashish");

    //create new election
    let res = await agent.get("/elections/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "Who is nani",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const electionCount = parsedGroupedResponse.elections.length;
    const latestElection = parsedGroupedResponse.elections[electionCount - 1];

    //add voter to the election
    res = await agent.get(`/elections/${latestElection.id}/voters/create`);
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${latestElection.id}/voters/create`)
      .send({
        VoterId: "Test voter",
        password: "Test password",
        _csrf: csrfToken,
      });
    expect(res.statusCode).toBe(302);
  });

  test("Deleting voter from the election ", async () => {
    const agent = request.agent(server);
    await login(agent, "user.b@gmail.com", "ashish");

    //Create New Election
    let res = await agent.get("/elections/create");
    let csrfToken = extractCsrfToken(res);
    await agent.post("/elections").send({
      electionName: "Class Representative",
      _csrf: csrfToken,
    });
    const groupedElectionsResponse = await agent
      .get("/elections")
      .set("Accept", "application/json");
    const parsedGroupedResponse = JSON.parse(groupedElectionsResponse.text);
    const electionCount = parsedGroupedResponse.elections.length;
    const latestElection = parsedGroupedResponse.elections[electionCount - 1];

    //add Voter to the election
    res = await agent.get(`/elections/${latestElection.id}/voters/create`);
    csrfToken = extractCsrfToken(res);
    res = await agent
      .post(`/elections/${latestElection.id}/voters/create`)
      .send({
        VoterId: "ashish",
        password: "011618",
        _csrf: csrfToken,
      });

    const groupedVotersResponse = await agent
      .get(`/elections/${latestElection.id}/voters`)
      .set("Accept", "application/json");
    const parsedVotersGroupedResponse = JSON.parse(groupedVotersResponse.text);
    const votersCount = parsedVotersGroupedResponse.voters.length;
    const latestVoter = parsedVotersGroupedResponse.voters[votersCount - 1];

    res = await agent.get(`/elections/${latestElection.id}/voters/`);
    csrfToken = extractCsrfToken(res);
    const deleteResponse = await agent
      .delete(`/elections/${latestElection.id}/voters/${latestVoter.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeleteResponse = JSON.parse(deleteResponse.text).success;
    expect(parsedDeleteResponse).toBe(true);

    res = await agent.get(`/elections/${latestElection.id}/voters/`);
    csrfToken = extractCsrfToken(res);
    const deleteResponse2 = await agent
      .delete(`/elections/${latestElection.id}/voters/${latestVoter.id}`)
      .send({
        _csrf: csrfToken,
      });
    const parsedDeleteResponse2 = JSON.parse(deleteResponse2.text).success;
    expect(parsedDeleteResponse2).toBe(false);
  });
});