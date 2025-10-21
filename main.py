from flask import Flask, render_template
import requests

app = Flask(__name__)

# Home page
@app.route("/")
def home():
    return render_template("index.html")

# About page
@app.route("/test")
def about():
    return render_template("test.html")

# Contact page
@app.route("/contact")
def contact():
    return render_template("contact.html")

# Another example route
@app.route("/routes")
def routes_page():
    url = "https://api.metro.net/LACMTA_Rail/route_overview"
    headers = {'Accept': 'application/json'}

    try:
        response = requests.get(url, headers=headers)
        data = response.json()
    except Exception as e:
        return f"<h1>Error fetching data: {e}</h1>"

    # Pass data to the template
    return render_template("routes.html", routes=data)


if __name__ == "__main__":
    app.run(debug=True)