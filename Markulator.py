


def inches_to_mm(inches_value):
    # 1 inch is approximately equal to 25.4 millimeters
    mm_value = inches_value * 25.4
    return mm_value

    #deviation function to check the deviation from inch  to melimeter
def deviation(rounded_number,non_rounded_number):
    print(rounded_number)
    print(non_rounded_number)
    if rounded_number > non_rounded_number:
        return True
    if rounded_number < non_rounded_number:
        return False
    else:
        return "same"
            
def main():
    # Get user input for inches value
    inches_input = float(input("Enter inches value: "))
    
    # Get user input for tolerance range
    min_tolerance = float(input("Enter minimum tolerance (inches): "))
    max_tolerance = float(input("Enter maximum tolerance (inches): "))

    # Calculate millimeters with tolerance
    rounded_mm = round(inches_to_mm(inches_input), 2)
    non_rounded_mm = inches_to_mm(inches_input)
    # Calculate Min
    min_tolerance_mm = inches_to_mm(min_tolerance)
    rounded_min_tolerance_mm = round(inches_to_mm(min_tolerance), 2)
    # Calculate Max
    max_tolerance_mm = inches_to_mm(max_tolerance)
    rounded_max_tolerance_mm = round(inches_to_mm(max_tolerance), 2)
    
    # Veriables for the Min values + nominal
    dev_check_min = non_rounded_mm - min_tolerance_mm
    dev_rounded_check_min = round(rounded_mm- rounded_min_tolerance_mm ,2)
    
    # Veriables for the Max values + nominal
    dev_check_max = max_tolerance_mm + non_rounded_mm
    dev_rounded_check_max = round(rounded_max_tolerance_mm + rounded_mm,2)
    

    max_check = deviation(dev_rounded_check_max,dev_check_max)
    min_check = deviation(dev_rounded_check_min,dev_check_min)
    print("before max: "+str(rounded_max_tolerance_mm))
    print("before min: "+str(rounded_min_tolerance_mm))
    if max_check == True:
        rounded_max_tolerance_mm = round(rounded_max_tolerance_mm -0.01,2)
    if min_check == False:
        rounded_min_tolerance_mm = round(rounded_min_tolerance_mm +0.01,2)
        
    #print output
    print("\nAnswer in milameter: "+str(rounded_mm))
    print("Maximum: "+str(rounded_max_tolerance_mm))
    print("Minimum: "+str(rounded_min_tolerance_mm))
  

if __name__ == "__main__":
    main()
