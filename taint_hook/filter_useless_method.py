import sys

package_name = sys.argv[1]

r = open('./my_sink.txt', 'r')
f = open('./my_sink1.txt', 'w')

all_lines = r.readlines()

for line in all_lines:
    print(line)
    if package_name in line:
        f.write(line)
    

r.close()
f.close()