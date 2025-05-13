#!/system/bin/sh

PORT=8080

while true; do
  REQUEST=$(nc -l -p $PORT -q 1)
  URI=$(echo "$REQUEST" | grep 'GET' | awk '{print $2}')

  case "$URI" in
    /api/device/model)
      VALUE=$(getprop ro.product.model)
      ;;
    /api/device/kernel)
      VALUE=$(uname -r)
      ;;
    *)
      VALUE="Unknown"
      ;;
  esac

  echo -e "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"result\":\"$VALUE\"}" \
    | nc -l -p $PORT -q 1
done
