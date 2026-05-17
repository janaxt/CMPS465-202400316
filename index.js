const { CosmosClient } = require("@azure/cosmos");

module.exports = async function (context, myBlob) {
    context.log("Processing blob:", context.bindingData.name);

    const filename = context.bindingData.name;
    const content = myBlob.toString("utf8");

    // Parse CSV
    const lines = content.trim().split("\n");
    const headers = lines[0].split(",");
    const records = lines.slice(1).map(line => {
        const values = line.split(",");
        const record = {};
        headers.forEach((h, i) => record[h.trim()] = values[i]?.trim());
        return record;
    });

    // Connect to Cosmos DB
    const client = new CosmosClient({
        endpoint: process.env.COSMOS_URL,
        key: process.env.COSMOS_KEY
    });

    const container = client
        .database("PipelineDB")
        .container("ProcessedRecords");

    // Insert each row as a document
    for (let i = 0; i < records.length; i++) {
        const doc = {
            ...records[i],
            id: `${filename}-row${i}`,
            filename: filename
        };
        await container.items.upsert(doc);
    }

    context.log(`Inserted ${records.length} records from ${filename}`);
};
