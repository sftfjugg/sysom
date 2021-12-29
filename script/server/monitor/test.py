# test_命令行传参.py
import sys 
def para_input():    
    print(len(sys.argv))      # 参数序列的长度，此时所有参数存放在一个list之中
    if len(sys.argv) < 2:        
        sys.exit("python error")    
    script_name = sys.argv[0] #第一个参数指的是脚本名称
    param_first = sys.argv[1]  #第二个参数，此时也是一个str列表
    param_second = sys.argv[2] #第三个参数  
     
    print(script_name)
    print(param_first)
    print(param_second)
    print(type(param_second))
    print(script_name, param_first, param_second) 
if __name__ == "__main__":
    para_input()
