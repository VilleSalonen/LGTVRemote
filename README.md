# LG TV Remote

LG TVs have an annoying issue where disconnecting a device's HDMI cable resets the input type and the label. Setting these manually via painfully slow Home Dashboard view is not the greatest user experience.

Tested with LG CX 48".

Usage:

    node remote.js <IP> <command> [args...]

Switch input:

    node remote.js 10.0.3.1 switch HDMI_1

Set input types and labels:

    node remote.js 10.0.3.1 key HOME PAUSE_1000 NOOP_"Open Home" \
        DOWN PAUSE_1000 ENTER PAUSE_3000 NOOP_"Open Home Dashboard" \
        UP_7 RIGHT_3 LEFT_2 ENTER PAUSE_1000 NOOP_"Open Settings dropdown" \
        DOWN ENTER PAUSE_1000 NOOP_"Edit settings" \
        DOWN LEFT ENTER PAUSE_1000 DOWN_9 ENTER PAUSE_1000 NOOP_"Set HDMI_1 as PC" \
        RIGHT ENTER PAUSE_1000 DELETE_100 PAUSE_1000 TEXT_"Mac Mini" DOWN_3 PAUSE_1000 NOOP_"Set HDMI_1 label" \
        DOWN LEFT ENTER PAUSE_1000 DOWN_9 ENTER PAUSE_1000 NOOP_"Set HDMI_2 as PC" \
        RIGHT ENTER PAUSE_1000 DELETE_100 PAUSE_1000 TEXT_"Fraktal" DOWN_3 PAUSE_1000 NOOP_"Set HDMI_2 label" \
        DOWN LEFT ENTER PAUSE_1000 DOWN_7 ENTER PAUSE_1000 NOOP_"Set HDMI_3 as Streaming Box" \
        RIGHT ENTER PAUSE_1000 DELETE_100 PAUSE_1000 TEXT_"Apple TV" DOWN_3 PAUSE_1000 NOOP_"Set HDMI_3 label" \
        DOWN LEFT ENTER PAUSE_1000 DOWN_9 ENTER PAUSE_1000 NOOP_"Set HDMI_4 as PC" \
        RIGHT ENTER PAUSE_1000 DELETE_100 PAUSE_1000 TEXT_"MacBook Pro" DOWN_3 PAUSE_1000 NOOP_"Set HDMI_4 label" \
        BACK RIGHT ENTER PAUSE_1000 NOOP_"Save settings" \
        RIGHT_2 ENTER NOOP_"Exit Home Dashboard"

## Credits

Based on the SSAP protocol implementation from [lgtv2](https://github.com/hobbyquaker/lgtv2).

## License

MIT
