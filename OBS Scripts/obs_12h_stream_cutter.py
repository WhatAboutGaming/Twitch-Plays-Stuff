import time
import datetime
import obspython as obs

oldSecond = 0
currentSecond = 0

oldMinute = 0
currentMinute = 0

oldHour = 0
currentHour = 0

stopSecondToCheck = 40
startSecondToCheck = 50
minuteToCheck = 59
hourToCheckAm = 11
hourToCheckPm = 23

def script_defaults(settings):
	print(datetime.datetime.utcnow().isoformat() + " Calling defaults")


def script_description():
	print(datetime.datetime.utcnow().isoformat() + " Calling description")

	return "<b>12 Hour Stream Cutter</b>" + \
	"<hr>" + \
	"End and start stream " + \
	"<br/>" + \
	"every 12 hours for" + \
	"<br/>" + \
	"YouTube archival reasons." + \
	"<br/><br/>" + \
	"Made by WhatAboutGamingLive" + \
	"<hr>"

def script_load(settings):
	print(datetime.datetime.utcnow().isoformat() + " Calling Load")

def script_tick(seconds):
	#print(time.time())
	global currentSecond
	global oldSecond

	global currentMinute
	global oldMinute

	global currentHour
	global oldHour

	global stopSecondToCheck
	global startSecondToCheck
	global minuteToCheck
	global hourToCheckAm
	global hourToCheckPm

	currentSecond = datetime.datetime.utcnow().second
	currentMinute = datetime.datetime.utcnow().minute
	currentHour = datetime.datetime.utcnow().hour
	if oldSecond != currentSecond:
		#print(currentSecond)
		# The block below ends the stream at 11:59:30 or 23:59:30
		if currentSecond == stopSecondToCheck:
			#print(datetime.datetime.utcnow().isoformat() + " Second is now " + str(stopSecondToCheck) + ", this is where we should stop the stream (" + str(currentSecond) + ")")
			if currentMinute == minuteToCheck:
				#print(datetime.datetime.utcnow().isoformat() + " Minute is now " + str(minuteToCheck) + " (" + str(currentMinute) + ")")
				if currentHour == hourToCheckAm or currentHour == hourToCheckPm:
					#print(datetime.datetime.utcnow().isoformat() + " Hour is now " + str(hourToCheckAm) + " or " + str(hourToCheckPm) + " (" + str(currentHour) + ")")
					if obs.obs_frontend_streaming_active() == True:
						print(datetime.datetime.utcnow().isoformat() + " OBS is streaming")
						obs.obs_frontend_streaming_stop()
						print(datetime.datetime.utcnow().isoformat() + " Stream should have ended now")
					if obs.obs_frontend_streaming_active() == False:
						print(datetime.datetime.utcnow().isoformat() + " OBS is NOT streaming, don't do anything")
		# The block below starts the stream at 11:59:40 or 23:59:40
		if currentSecond == startSecondToCheck:
			#print(datetime.datetime.utcnow().isoformat() + " Second is now " + str(startSecondToCheck) + ", this is where we should start the stream (" + str(currentSecond) + ")")
			if currentMinute == minuteToCheck:
				#print(datetime.datetime.utcnow().isoformat() + " Minute is now " + str(minuteToCheck) + " (" + str(currentMinute) + ")")
				if currentHour == hourToCheckAm or currentHour == hourToCheckPm:
					#print(datetime.datetime.utcnow().isoformat() + " Hour is now " + str(hourToCheckAm) + " or " + str(hourToCheckPm) + " (" + str(currentHour) + ")")
					if obs.obs_frontend_streaming_active() == False:
						print(datetime.datetime.utcnow().isoformat() + " OBS is NOT streaming")
						obs.obs_frontend_streaming_start()
						print(datetime.datetime.utcnow().isoformat() + " Stream should have started now")
					if obs.obs_frontend_streaming_active() == True:
						print(datetime.datetime.utcnow().isoformat() + " OBS is streaming, don't do anything")

	oldSecond = currentSecond
	oldMinute = currentMinute
	oldHour = currentHour

def script_update(settings):
	print(datetime.datetime.utcnow().isoformat() + " Calling Update")