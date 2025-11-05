import joblib
import numpy as np

model = joblib.load("stress_model.pkl")

def predict_stress(data):
    try:
        features = np.array([
            data["heart_rate"],
            data["sleep_hours"],
            data["steps"],
            data["calories_burned"]
        ]).reshape(1, -1)
        prediction = model.predict(features)
        stress_level = "High" if prediction[0] == 1 else "Low"
        return {"status": "success", "prediction": stress_level}
    except Exception as e:
        return {"status": "error", "message": str(e)}

