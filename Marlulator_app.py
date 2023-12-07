import math
import customtkinter as ctk


def inches_to_mm(inches_value):
    mm_value = inches_value * 25.4
    return mm_value


def deviation(rounded_number, non_rounded_number):
    if rounded_number > non_rounded_number:
        return True
    if rounded_number < non_rounded_number:
        return False
    else:
        return "same"


def calculator():
    # Get user input for inches value
    inches_input = float(inches_entry.get())

    # Get user input for tolerance range
    min_tolerance = float(min_tolerance_entry.get())
    max_tolerance = float(max_tolerance_entry.get())

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
    dev_rounded_check_min = round(rounded_mm - rounded_min_tolerance_mm, 2)

    # Veriables for the Max values + nominal
    dev_check_max = max_tolerance_mm + non_rounded_mm
    dev_rounded_check_max = round(rounded_max_tolerance_mm + rounded_mm, 2)

    max_check = deviation(dev_rounded_check_max, dev_check_max)
    min_check = deviation(dev_rounded_check_min, dev_check_min)

    if max_check == True:
        if max_tolerance_mm == 0:
            rounded_mm = (math.floor(non_rounded_mm * 10 ** 2)) / 100
        else:
            rounded_max_tolerance_mm = round(rounded_max_tolerance_mm - 0.01, 2)

    if min_check == False:
        if min_tolerance_mm == 0:
            rounded_mm = (math.ceil(non_rounded_mm * 10 ** 2)) / 100
            rounded_min_tolerance_mm = rounded_min_tolerance_mm
        else:
            rounded_min_tolerance_mm = round(rounded_min_tolerance_mm - 0.01, 2)

    # Update output labels
    #nominal_mm_label.configure(placeholder_text=str(rounded_mm))
    #max_tolerance_label.configure(placeholder_text=str(rounded_max_tolerance_mm))
    #min_tolerance_label.configure(placeholder_text=str(rounded_min_tolerance_mm))
    nominal_mm_label.delete(0, 10)
    max_tolerance_label.delete(0, 10)
    min_tolerance_label.delete(0, 10)
    nominal_mm_label.insert(0,str(rounded_mm))
    max_tolerance_label.insert(0,str(rounded_max_tolerance_mm))
    min_tolerance_label.insert(0,str(rounded_min_tolerance_mm))
def switch_to_frame1():
    frame_2.pack_forget()
    frame_1.pack(fill="both", expand=True)


def switch_to_frame2():
    frame_1.pack_forget()
    frame_2.pack(fill="both", expand=True)


# Create the main window
root = ctk.CTk()
root.title("Markulator")
root.geometry("400x350")

# Create the switch button frame
frame_switch = ctk.CTkFrame(root)
frame_switch.pack(fill="x", padx=20, pady=10)

switch_button1 = ctk.CTkButton(frame_switch, text="Frame 1", command=switch_to_frame1)
switch_button1.pack(side="left", padx=20)

switch_button2 = ctk.CTkButton(frame_switch, text="Frame 2", command=switch_to_frame2)
switch_button2.pack(side="left", padx=20)

# Create the first frame for user input
frame_1 = ctk.CTkFrame(root)
frame_1.pack(side="left",fill="both", expand=True)

inches_label = ctk.CTkLabel(frame_1, text="Tolerence Calculator",font=("suns_serif",25))
inches_label.pack(side="top",ipadx=40,ipady=20)

inches_entry = ctk.CTkEntry(frame_1,placeholder_text="Nominal",font=("suns_serif",20))
inches_entry.place(relx=0.1,rely=0.4,relheight=0.15,relwidth=0.3)


max_tolerance_entry = ctk.CTkEntry(frame_1,placeholder_text="Max",font=("suns_serif",15))
max_tolerance_entry.place(relx=0.28,rely=0.24,relheight=0.1,relwidth=0.12)
print(max_tolerance_entry.cget("corner_radius"))

min_tolerance_entry = ctk.CTkEntry(frame_1,placeholder_text="Min",font=("suns_serif",15))
min_tolerance_entry.place(relx=0.28,rely=0.618,relheight=0.1,relwidth=0.12)



calculate_button = ctk.CTkButton(frame_1, text="Calculate", command=calculator, width=200,height=48,font=("suns_serif",20))
calculate_button.pack(side="bottom", pady=10)

# Create a entrys for output for the output
max_tolerance_label = ctk.CTkEntry(frame_1, placeholder_text="Maximum",font=("suns_serif",15))
max_tolerance_label.place(relx=0.68,rely=0.24,relheight=0.1,relwidth=0.12)
nominal_mm_label = ctk.CTkEntry(frame_1, placeholder_text="Nominal",font=("suns_serif",20))
nominal_mm_label.place(relx=0.5,rely=0.4,relheight=0.15,relwidth=0.3)

min_tolerance_label = ctk.CTkEntry(frame_1, placeholder_text="Minimum",font=("suns_serif",15))
min_tolerance_label.place(relx=0.68,rely=0.618,relheight=0.1,relwidth=0.12)

# Create the second frame (you can add your code here)
frame_2 = ctk.CTkFrame(root)
# Add your code for frame_2 here


switch_to_frame1()  # Start with Frame 1

root.mainloop()
