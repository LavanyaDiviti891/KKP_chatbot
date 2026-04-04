import sys
import pickle
import os

base_dir = os.path.dirname(__file__)
model_path = os.path.join(base_dir, "model.pkl")

model = pickle.load(open(model_path, "rb"))

try:
    day = int(sys.argv[1])
    prediction = model.predict([[day]])
    print(prediction[0])
except Exception as e:
    print("ERROR:", str(e))