def inches_to_mm(inches_value):
    # 1 inch is approximately equal to 25.4 millimeters
    mm_value = inches_value * 25.4
    return mm_value

def main():
    # Get user input for inches value
    inches_input = float(input("Enter inches value: "))

    # Get user input for tolerance range
    min_tolerance = float(input("Enter minimum tolerance: "))
    max_tolerance = float(input("Enter maximum tolerance: "))

    # Calculate millimeters with tolerance
    rounded_mm = round(inches_to_mm(inches_input), 2)
    non_rounded_mm = inches_to_mm(inches_input)

    # Check for deviation and adjust non-rounded value if necessary
    deviation = abs(rounded_mm - non_rounded_mm)
    if deviation > 0.005:  # Adjust if deviation is more than 0.005 millimeters
        non_rounded_mm = rounded_mm

    # Display the results
    print(f"{inches_input} inches is approximately:")
    print(f"Rounded: {rounded_mm} millimeters")
    print(f"Non-rounded: {non_rounded_mm} millimeters")

if __name__ == "__main__":
    main()
