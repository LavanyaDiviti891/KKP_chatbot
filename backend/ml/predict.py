import pickle

model = pickle.load(open("model.pkl", "rb"))

# Predict for next day (31)
prediction = model.predict([[31]])

print(round(prediction[0], 2))