This is an inofficial netatmo skill for amazon alexa, to get values of your wetterstation.

# HowTo use
Ask Alexa:
<br /><br />
- Alexa, frage die Wetterstation, wie hoch der CO2-Wert im Wohnzimmer ist.<br />
> Der CO2 Wert im Wohnzimmer beträgt 623 ppm.
<br /><br />
- Alexa, frage die Wetterstation, wie viel Grad es Aussen hat.<br />
> Aussen hat es 4,6 Grad.

# HowTo Setup
1. Sign in in netatmo.
2. Name your wetterstation modules and devices like the names written in SlotType.txt (or add some names to SlotType.txt)
3. Register as a developer on netatmo.
4. Create a new app
5. Copy the client id and the client secret.
6. Register as a developer on amazon aws.
7. Create a new lambda function (type = NodeJS)
8. Copy the code of NetatmoLambda.js into the lambda function
9. Set the environment variables (key/value pairs): CLIENT_ID, CLIENT_SECRET, USER_ID, PASSWORD
10. Create a new Alexa Skill (Type = Custom)
11. Set an Invocation Name (To use it in the same way as the example above, set it to "Wetterstation")
12. Copy IntentSchema.json, SlotType.txt and Utterances.txt and paste it into the Interaction Model.
13. Set the AWS Lambda ARN (AwsConsole/Lambda/Functions/<YourFunctionName> -> Right upper corner)
14. Finished

# Thanks To
http://stackoverflow.com/questions/33859826/linking-netatmo-weather-station-to-amazon-echo-alexa