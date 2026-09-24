"""
LowKeySigns - Service Counter Vocabulary & Filtering Module
Maps and prioritizes service-desk vocabulary from the 250-class ASL model.
"""

# Core Service Desk Vocabulary available in the 250-class model
SERVICE_COUNTER_VOCAB = {
    # Courtesy & Acknowledgement
    "hello": {"display": "Hello", "category": "Greeting"},
    "bye": {"display": "Goodbye", "category": "Greeting"},
    "please": {"display": "Please", "category": "Courtesy"},
    "thankyou": {"display": "Thank You", "category": "Courtesy"},
    "yes": {"display": "Yes", "category": "Response"},
    "no": {"display": "No", "category": "Response"},
    
    # Queue, Time & Waiting
    "wait": {"display": "Wait", "category": "Action"},
    "stay": {"display": "Stay", "category": "Action"},
    "time": {"display": "Time", "category": "Inquiry"},
    "now": {"display": "Now", "category": "Temporal"},
    "tomorrow": {"display": "Tomorrow", "category": "Temporal"},
    "finish": {"display": "Done / Finished", "category": "Status"},
    
    # Assistance, Medical & Emergency
    "sick": {"display": "Sick / Unwell", "category": "Medical"},
    "owie": {"display": "Pain / Hurt", "category": "Medical"},
    "callonphone": {"display": "Call / Phone", "category": "Emergency"},
    "police": {"display": "Police", "category": "Emergency"},
    "fireman": {"display": "Firefighter / Fire", "category": "Emergency"},
    
    # Desk Supplies & Daily Needs
    "water": {"display": "Water", "category": "Basic Need"},
    "pen": {"display": "Pen", "category": "Desk Item"},
    "pencil": {"display": "Pencil", "category": "Desk Item"},
    
    # Wayfinding & Inquiries
    "where": {"display": "Where?", "category": "Question"},
    "who": {"display": "Who?", "category": "Question"},
    "why": {"display": "Why?", "category": "Question"}
}

def is_service_word(word: str) -> bool:
    """Checks if the recognized sign is part of the service-counter profile."""
    return word.lower().replace(" ", "") in SERVICE_COUNTER_VOCAB

def get_display_name(word: str) -> str:
    """Returns the formatted display name for a word."""
    clean = word.lower().replace(" ", "")
    if clean in SERVICE_COUNTER_VOCAB:
        return SERVICE_COUNTER_VOCAB[clean]["display"]
    return word.capitalize()
