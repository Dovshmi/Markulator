import math
import customtkinter as ctk
from PIL import Image,ImageTk
memory_list=[]
global back_count
back_count=0
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
    check_list=[inches_input,max_tolerance,min_tolerance,rounded_mm,rounded_max_tolerance_mm,rounded_min_tolerance_mm]
    if check_list in memory_list:
        print("same")
    else:
        memory_list.append([inches_input,max_tolerance,min_tolerance ,rounded_mm ,rounded_max_tolerance_mm,rounded_min_tolerance_mm ])
        print(memory_list)
    global back_count
    back_count=0
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
def goback():
    global back_count
    len_list=len(memory_list)
    if back_count < len_list:
        back_count=back_count+1
        pointer=len_list-back_count
        print(memory_list[pointer])
    #print all the data from the ram
        inches_entry.delete(0, 10)
        min_tolerance_entry.delete(0, 10)
        max_tolerance_entry.delete(0, 10)
        nominal_mm_label.delete(0, 10)
        max_tolerance_label.delete(0, 10)
        min_tolerance_label.delete(0, 10)
        inches_entry.insert(0,str(memory_list[pointer][0]))
        max_tolerance_entry.insert(0,str(memory_list[pointer][1]))
        min_tolerance_entry.insert(0,str(memory_list[pointer][2]))
        nominal_mm_label.insert(0,str(memory_list[pointer][3]))
        max_tolerance_label.insert(0,str(memory_list[pointer][4]))
        min_tolerance_label.insert(0,str(memory_list[pointer][5]))
def forward():
    global back_count
    if back_count!=0:
        len_list=len(memory_list)
        back_count=back_count-1
        pointer=len_list-back_count
        print(memory_list[pointer])
        #print all the data from the ram
        inches_entry.delete(0, 10)
        min_tolerance_entry.delete(0, 10)
        max_tolerance_entry.delete(0, 10)
        nominal_mm_label.delete(0, 10)
        max_tolerance_label.delete(0, 10)
        min_tolerance_label.delete(0, 10)
        inches_entry.insert(0,str(memory_list[pointer][0]))
        max_tolerance_entry.insert(0,str(memory_list[pointer][1]))
        min_tolerance_entry.insert(0,str(memory_list[pointer][2]))
        nominal_mm_label.insert(0,str(memory_list[pointer][3]))
        max_tolerance_label.insert(0,str(memory_list[pointer][4]))
        min_tolerance_label.insert(0,str(memory_list[pointer][5]))
def clear():
    inches_entry.delete(0, 10)
    min_tolerance_entry.delete(0, 10)
    max_tolerance_entry.delete(0, 10)
    nominal_mm_label.delete(0, 10)
    max_tolerance_label.delete(0, 10)
    min_tolerance_label.delete(0, 10)
    global back_count
    back_count=0
# Create the main window
root = ctk.CTk()
root.title("Markulator")
root.geometry("400x350")
ctk.set_appearance_mode("dark")

# create a memory list

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

# Big ass title
main_label = ctk.CTkLabel(frame_1, text="Tolerence Calculator",font=("suns_serif",25))
main_label.pack(side="top",ipadx=40,ipady=20)

Inch_label=ctk.CTkLabel(frame_1,text="Inch",font=("Impact",24))
Inch_label.place(relx=0.1,rely=0.2,relheight=0.18,relwidth=0.15)

mm_label=ctk.CTkLabel(frame_1,text="Mm",font=("Impact",24))
mm_label.place(relx=0.6,rely=0.2,relheight=0.18,relwidth=0.15)

#importing images for the buttons 
image_equal_CTk=ctk.CTkImage(light_image=Image.open('pictures/exchange.png'),dark_image=Image.open('pictures/exchange_white.png'),size=(56,56))
equal_button=ctk.CTkButton(frame_1,image=image_equal_CTk,text="",fg_color="transparent",hover=False,command=calculator)
equal_button.place(relx=0.415,rely=0.385,relheight=0.18,relwidth=0.15)

image_back_CTk=ctk.CTkImage(light_image=Image.open('pictures/back-arrow.png'),dark_image=Image.open('pictures/back-arrow_white.png'),size=(40,40))
back_button=ctk.CTkButton(frame_1,image=image_back_CTk,text="",command=goback)
back_button.place(relx=0.1,rely=0.78,relheight=0.2,relwidth=0.18)

image_forward_CTk=ctk.CTkImage(light_image=Image.open('pictures/forward-arrow.png'),dark_image=Image.open('pictures/forward-arrow_white.png'),size=(40,40))
forward_button=ctk.CTkButton(frame_1,image=image_forward_CTk,text="",command=forward)
forward_button.place(relx=0.7,rely=0.78,relheight=0.2,relwidth=0.18)

image_clear_CTk=ctk.CTkImage(light_image=Image.open('pictures/edit_clear.png'),dark_image=Image.open('pictures/edit_clear_white.png'),size=(40,40))
clear_button=ctk.CTkButton(frame_1,image=image_clear_CTk,text="",command=clear)
clear_button.place(relx=0.5,rely=0.78,relheight=0.2,relwidth=0.18)

inches_entry = ctk.CTkEntry(frame_1,placeholder_text="Nominal",font=("suns_serif",20))
inches_entry.place(relx=0.1,rely=0.4,relheight=0.15,relwidth=0.3)


max_tolerance_entry = ctk.CTkEntry(frame_1,placeholder_text="Max",font=("suns_serif",15))
max_tolerance_entry.place(relx=0.28,rely=0.24,relheight=0.1,relwidth=0.18)
print(max_tolerance_entry.cget("corner_radius"))

min_tolerance_entry = ctk.CTkEntry(frame_1,placeholder_text="Min",font=("suns_serif",15))
min_tolerance_entry.place(relx=0.28,rely=0.618,relheight=0.1,relwidth=0.18)

calculate_button=ctk.CTkButton(frame_1,text="CAL",font=("impact",24),text_color=('black','white'),command=calculator)
calculate_button.place(relx=0.3,rely=0.78,relheight=0.2,relwidth=0.18)

# Create a entrys for output for the output
max_tolerance_label = ctk.CTkEntry(frame_1, placeholder_text="Max",font=("suns_serif",15))
max_tolerance_label.place(relx=0.76,rely=0.24,relheight=0.1,relwidth=0.18)
nominal_mm_label = ctk.CTkEntry(frame_1, placeholder_text="Nominal",font=("suns_serif",20))
nominal_mm_label.place(relx=0.58,rely=0.4,relheight=0.15,relwidth=0.3)

min_tolerance_label = ctk.CTkEntry(frame_1, placeholder_text="Min",font=("suns_serif",15))
min_tolerance_label.place(relx=0.76,rely=0.618,relheight=0.1,relwidth=0.18)

# Create the second frame (you can add your code here)
frame_2 = ctk.CTkFrame(root)
# Add your code for frame_2 here


switch_to_frame1()  # Start with Frame 1

root.mainloop()
