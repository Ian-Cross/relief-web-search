import React, { useEffect, useState } from "react";

function ReliefWebSearch() {
	const [snippits, setSnippits] = useState([]);
	const [articles, setArticles] = useState([]);

	const submitSearch = async () => {
		let baseURL = "https://api.reliefweb.int/v1/reports";
		let appName = "appname=rwint-user-0";

		let data = {
			limit: 100,
			profile: "list",
			preset: "latest",
			slim: "1",
			query: {
				value: "WFP Syria Situation Report",
				operator: "AND",
			},
		};

		let response = await fetch(baseURL + "?" + appName, {
			method: "POST",
			cache: "no-cache",
			body: JSON.stringify(data), // body data type must match "Content-Type" header
		});

		response = await response.json();

		// console.log(response);
		let articles = [];
		for (let article of response["data"]) {
			if (article["fields"]["source"][0]["name"] !== "World Food Programme")
				continue;
			if (
				article["fields"]["primary_country"]["name"] !== "Syrian Arab Republic"
			)
				continue;

			if (!article["fields"]["title"].includes("WFP")) continue;

			articles.push({
				id: article["id"],
				score: article["score"],
				...article["fields"],
			});
		}
		setArticles(articles);
	};

	useEffect(() => {
		async function fetchArticleContent() {
			let new_snippits = [];
			for (let article of articles) {
				let new_snippit = {};
				let response = await fetch(
					"https://api.reliefweb.int/v1/reports/" + article["id"]
				);
				response = await response.json();
				new_snippit["link"] = response["data"]["0"]["fields"]["url"];
				new_snippit["country"] = article["country"][0]["name"];
				new_snippit["title"] = article["title"];

				let body = response["data"]["0"]["fields"]["body-html"].split("\n");
				let content = [];
				for (let line of body) {
					if (line === "") continue;
					content.push(line.replace(/<\/?[^>]*>/g, ""));
				}
				let active = false;
				new_snippit["numbers"] = [];
				for (let line of content) {
					if (
						line.toLowerCase().includes("highlights") ||
						line.toLowerCase().includes("situation update") ||
						line.toLowerCase().includes("operational updates")
					)
						active = false;
					if (line.toLowerCase().includes("in numbers")) active = true;
					else if (active) new_snippit["numbers"].push(line);
				}
				new_snippits.push(JSON.parse(JSON.stringify(new_snippit)));
			}
			setSnippits(new_snippits);
		}
		fetchArticleContent();
	}, [articles]);

	return (
		<div>
			<button onClick={submitSearch}>Fetch</button>
			{snippits.map((item, index) => (
				<div key={index} style={{ border: "1px solid red" }}>
					<div>Country: {item["country"]}</div>
					<div>
						<a target="_blank" rel="noreferrer" href={item["link"]}>
							Title: {item["title"]}:
						</a>
					</div>
					<div>
						{item["numbers"].map((number, jndex) => (
							<div key={jndex + "number"}>{number}</div>
						))}
					</div>
				</div>
			))}
		</div>
	);
}

export default ReliefWebSearch;
