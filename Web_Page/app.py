from flask import Flask, jsonify, render_template, send_from_directory
import pandas as pd
app = Flask(__name__)

@app.route("/")
def home():
    return render_template("index.html")

@app.route('/index2/')
def index2():
    return render_template('index2.html')

@app.route('/StudentMap/')
def studentMap():
    return render_template('studentMap.html')

@app.route('/index3/')
def index3():
    return render_template('index3.html')

@app.route('/exportdata', methods=["POST"])
def export():
    df=pd.read_html("http://127.0.0.1:5000/index2/")[0]
    df.head()
    df.to_csv("static/data/data.csv")
    return send_from_directory("/static/data/", "data.csv", as_attachment=True)

if __name__ == "__main__":
    app.run(debug=True)

