#include <iostream>
#include <fstream>
#include <string>
using namespace std;

int main(int argc, char* argv[]) {

	if (argc != 3) {
		std::cerr << "type mysql id and password" << std::endl;
		return -1;
	}
	system("npm install");
	
	string id = argv[1];
	string pw = argv[2];
	ifstream dbin("config/database.js");
	ofstream temp1("config/temp.js");
	string str;
	int i = 0;
	while (getline(dbin, str))
	{
		if (i == 4)
			str = "        'user': '"+id+"',";
		if (i == 5)
			str = "        'password': '"+pw+"'";
		temp1 << str << std::endl;
		i++;
	}

	ifstream temp2("config/temp.js");
	ofstream dbout("config/database.js");
	while (getline(temp2, str))
		dbout << str << std::endl;
	remove("config/temp.js");
	
	string createsql = "mysql -u"+id+" -p"+pw+" < create.sql";
	std::cout << createsql << std::endl;
	system(createsql.c_str());

	system("node server0.js");

	return 0;
}