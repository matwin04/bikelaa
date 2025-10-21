from flask import Flask, render_template
from endpoints import api_bp

app = Flask(__name__)

# Register API blueprint
app.register_blueprint(api_bp)

@app.get("/")
def read_root():
    return render_template("index.html")
@app.get("/test")
def test():
    return test("test.html")
if __name__ == "__main__":
    app.run(debug=True)
