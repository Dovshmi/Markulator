def mm_to_inches(mm_value):
    # 1 millimeter is approximately equal to 0.0393701 inches
    inches_value = mm_value * 0.0393701
    return inches_value

def main():
    # Get user input for millimeter value
    mm_input = float(input("Enter millimeter value: "))

    # Get user input for tolerance range
    min_tolerance = float(input("Enter minimum tolerance: "))
    max_tolerance = float(input("Enter maximum tolerance: "))

    # Calculate inches with tolerance
    rounded_inches = round(mm_to_inches(mm_input), 2)
    non_rounded_inches = mm_to_inches(mm_input)

    # Check for deviation and adjust non-rounded value if necessary
    deviation = abs(rounded_inches - non_rounded_inches)
    if deviation > 0.005:  # Adjust if deviation is more than 0.005 inches
        non_rounded_inches = rounded_inches

    # Display the results
    print(f"{mm_input} millimeters is approximately:")
    print(f"Rounded: {rounded_inches} inches")
    print(f"Non-rounded: {non_rounded_inches} inches")

if __name__ == "__main__":
    main()
