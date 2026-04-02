import sqlite3
import pandas as pd
from sklearn.linear_model import LinearRegression
import pickle

conn = sqlite3.connect("../db/sales.db")
df = pd.read_sql_query("SELECT day, revenue FROM sales", conn)

X = df[["day"]]
y = df["revenue"]

model = LinearRegression()
model.fit(X, y)

pickle.dump(model, open("model.pkl", "wb"))

print("✅ Model trained and saved")