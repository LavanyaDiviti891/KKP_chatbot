import sys
import pickle
import os

# correct path to model
base_dir = os.path.dirname(__file__)
model_path = os.path.join(base_dir, "model.pkl")

model = pickle.load(open(model_path, "rb"))

day = int(sys.argv[1])

prediction = model.predict([[day]])

print(prediction[0])