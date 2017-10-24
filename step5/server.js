var jsonApi = require("jsonapi-server");

jsonApi.setConfig({
  port: 16006,
  graphiql: true,
  swagger: {
    title: "Example JSON:API Server",
    version: "0.1.1",
    description: "This is the API description block that shows up in the swagger.json",
    contact: {
      name: "API Contact",
      email: "apicontact@holidayextras.com",
      url: "docs.hapi.holidayextras.com"
    },
    license: {
      name: "MIT",
      url: "http://opensource.org/licenses/MIT"
    }
  }
});

jsonApi.define({
  resource: "photos",
  handlers: new jsonApi.MemoryHandler(),
  attributes: {
    title: jsonApi.Joi.string(),
    url: jsonApi.Joi.string().uri(),
    height: jsonApi.Joi.number().min(1).max(10000).precision(0),
    width: jsonApi.Joi.number().min(1).max(10000).precision(0)
  }
});

jsonApi.define({
  resource: "documents",
  handlers: new jsonApi.MemoryHandler(),
  attributes: {
    title: jsonApi.Joi.string(),
    content: jsonApi.Joi.string()
  }
});

jsonApi.define({
  resource: "contacts",
  handlers: new jsonApi.MemoryHandler(),
  attributes: {
    first_name: jsonApi.Joi.string(),
    last_name: jsonApi.Joi.string()
  }
});

jsonApi.start();
