const fs = require("fs");
const path = require("path");

const environment = {
    supabaseUrl: process.env.NG_APP_Supabase_URL || "",
    supabaseKey: process.env.NG_APP_Supabase_API_KEY || "",
};

const targetPath = path.resolve(__dirname, "./environment.ts");
const fileContent = `
export const environment = ${JSON.stringify(environment, null, 2)};
`;

fs.writeFile(targetPath, fileContent, function (err) {
    if (err) {
        console.error(err);
        throw err;
    }

    console.log("ENV file set");
});
